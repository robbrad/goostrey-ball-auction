import React, { useState, useEffect, useContext } from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import { itemStatus } from '../utils/itemStatus';
import { formatField, formatMoney } from '../utils/formatString';
import { validateName, validateBidAmount } from '../utils/validation';
import { createUserWithEmailAndPassword, updateProfile, signInWithEmailAndPassword, sendPasswordResetEmail, signOut } from 'firebase/auth';
import { doc, setDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { ModalsContext } from '../contexts/ModalsProvider';
import { ModalTypes } from '../utils/modalTypes';
import { useAuth } from '../contexts/AuthProvider';

const Modal = ({ type, title, children }) => {
  const { closeModal, currentModal } = useContext(ModalsContext);

  if (type !== currentModal) return null;

  return ReactDOM.createPortal(
    <div
      className='modal fade show'
      style={{ display: 'block' }}
      onClick={closeModal}
    >
      <div
        className='modal-dialog modal-dialog-centered modal-dialog-scrollable'
        onClick={(e) => e.stopPropagation()}
      >
        <div className='modal-content'>
          <div className='modal-header'>
            <h5 className='modal-title'>{title}</h5>
            <button className='btn-close' onClick={closeModal} />
          </div>
          {React.Children.map(children, (child, index) => (
            <div key={index}>{child}</div>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
};

Modal.propTypes = {
  type: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

const ItemModal = () => {
  const { activeItem, openModal, closeModal } = useContext(ModalsContext);
  const { user } = useAuth();
  const [secondaryImageSrc, setSecondaryImageSrc] = useState('');
  const minIncrease = 1;
  const [bid, setBid] = useState('');
  const [valid, setValid] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [minBid, setMinBid] = useState('-.--');

  useEffect(() => {
    if (activeItem.secondaryImage === undefined) return;
    import(`../assets/${activeItem.secondaryImage}.png`).then((src) => {
      setSecondaryImageSrc(src.default);
    });
  }, [activeItem.secondaryImage]);

  useEffect(() => {
    const status = itemStatus(activeItem);
    setMinBid(formatMoney(activeItem.currency, status.amount + minIncrease));
  }, [activeItem]);

  const delayedClose = () => {
    setTimeout(() => {
      closeModal();
      setFeedback('');
      setValid('');
    }, 1000);
  };

  const handleSubmitBid = () => {
    // Check if user is signed in
    if (!user) {
      setFeedback('You must be logged in to place a bid');
      setValid('is-invalid');
      return;
    }

    // Check if user has a display name (completed registration)
    if (!user.displayName) {
      setFeedback('You must register before placing a bid');
      setValid('is-invalid');
      setTimeout(() => {
        openModal(ModalTypes.SIGN_UP);
        setIsSubmitting(false);
        setValid('');
      }, 1000);
      return;
    }

    // Check if item has ended
    const nowTime = new Date().getTime();
    if (activeItem.endTime - nowTime <= 0) {
      setFeedback('Sorry, this item has ended!');
      setValid('is-invalid');
      delayedClose();
      return;
    }

    // Validate bid amount using validateBidAmount utility
    const status = itemStatus(activeItem);
    const validation = validateBidAmount(bid, status.amount, minIncrease);
    if (!validation.valid) {
      setFeedback(validation.error);
      setValid('is-invalid');
      return;
    }

    // Disable submit button to prevent duplicate submissions
    setIsSubmitting(true);

    // Place bid - write to Firestore with user's UID and amount
    const amount = parseFloat(bid);
    updateDoc(doc(db, 'auction', 'items'), {
      [formatField(activeItem.id, status.bids + 1)]: {
        amount,
        uid: user.uid,
        timestamp: Timestamp.now(),
      },
    })
      .then(() => {
        console.debug('handleSubmitBid() write to auction/items');
        setValid('is-valid');
        delayedClose();
      })
      .catch((error) => {
        console.error('Error placing bid:', error);
        setFeedback('Error placing bid. Please try again.');
        setValid('is-invalid');
        setIsSubmitting(false);
      });
  };

  const handleChange = (e) => {
    setBid(e.target.value);
    setIsSubmitting(false);
    setValid('');
    setFeedback('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !isSubmitting) {
      handleSubmitBid();
    }
  };

  return (
    <Modal type={ModalTypes.ITEM} title={activeItem.title}>
      <div className='modal-body'>
        <p>{activeItem.detail}</p>
        <img
          src={secondaryImageSrc}
          className='img-fluid'
          alt={activeItem.title}
        />
      </div>
      <div className='modal-footer justify-content-start'>
        <div className='input-group mb-2'>
          <span className='input-group-text'>{activeItem.currency}</span>
          <input
            className={`form-control ${valid}`}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
          />
          <button
            type='submit'
            className='btn btn-primary'
            onClick={handleSubmitBid}
            disabled={isSubmitting}
          >
            Submit bid
          </button>
          <div className='invalid-feedback'>{feedback}</div>
        </div>
        <label className='form-label'>Enter {minBid} or more</label>
        <p className='text-muted'>
          (Good Luck!)
        </p>
      </div>
    </Modal>
  );
};

const SignUpModal = () => {
  const { closeModal } = useContext(ModalsContext);
  const [firstName, setFirstName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstNameError, setFirstNameError] = useState('');
  const [surnameError, setSurnameError] = useState('');
  const [valid, setValid] = useState('');
  const [feedback, setFeedback] = useState('');

  const handleSignUp = async () => {
    // Validate first name
    const firstNameResult = validateName(firstName);
    const surnameResult = validateName(surname);

    setFirstNameError(firstNameResult.valid ? '' : firstNameResult.error);
    setSurnameError(surnameResult.valid ? '' : surnameResult.error);

    if (!firstNameResult.valid || !surnameResult.valid) {
      return;
    }

    const trimmedFirstName = firstName.trim();
    const trimmedSurname = surname.trim();
    const displayName = `${trimmedFirstName} ${trimmedSurname}`;

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await updateProfile(user, { displayName });
      await setDoc(doc(db, 'users', user.uid), {
        firstName: trimmedFirstName,
        surname: trimmedSurname,
        name: displayName,
        admin: '',
      });
      setValid('is-valid');
      setFeedback('Sign up successful!');
      setTimeout(() => {
        closeModal();
        setValid('');
        setFeedback('');
        setFirstName('');
        setSurname('');
        setEmail('');
        setPassword('');
      }, 2000);
    } catch (error) {
      setValid('is-invalid');
      setFeedback(error.message);
      console.error('Error signing up:', error);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSignUp();
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'firstName') {
      setFirstName(value);
      setFirstNameError('');
    }
    if (name === 'surname') {
      setSurname(value);
      setSurnameError('');
    }
    if (name === 'email') setEmail(value);
    if (name === 'password') setPassword(value);
    setValid('');
    setFeedback('');
  };

  return (
    <Modal type={ModalTypes.SIGN_UP} title='Sign up for Markatplace Auction'>
      <div className='modal-body'>
        <p>
          We use anonymous authentication provided by Google. Your account is
          attached to your device signature.
        </p>
        <form onSubmit={(e) => e.preventDefault()}>
          <div className='form-floating mb-3'>
            <input
              autoFocus
              id='firstName-input'
              type='text'
              name='firstName'
              maxLength={50}
              className={`form-control ${firstNameError ? 'is-invalid' : ''}`}
              value={firstName}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder='Enter your first name'
            />
            <label>First Name</label>
            {firstNameError && (
              <div className='invalid-feedback'>{firstNameError}</div>
            )}
          </div>
          <div className='form-floating mb-3'>
            <input
              id='surname-input'
              type='text'
              name='surname'
              maxLength={50}
              className={`form-control ${surnameError ? 'is-invalid' : ''}`}
              value={surname}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder='Enter your surname'
            />
            <label>Surname</label>
            {surnameError && (
              <div className='invalid-feedback'>{surnameError}</div>
            )}
          </div>
          <div className='form-floating mb-3'>
            <input
              id='email-input'
              type='email'
              name='email'
              className={`form-control ${valid}`}
              value={email}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder='Enter your email'
            />
            <label>Email</label>
          </div>
          <div className='form-floating mb-3'>
            <input
              id='password-input'
              type='password'
              name='password'
              className={`form-control ${valid}`}
              value={password}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder='Enter your password'
            />
            <label>Password</label>
          </div>
          <div className={`invalid-feedback ${valid === 'is-invalid' ? 'd-block' : ''}`}>
            {feedback}
          </div>
          <div className={`valid-feedback ${valid === 'is-valid' ? 'd-block' : ''}`}>
            {feedback}
          </div>
        </form>
      </div>
      <div className='modal-footer'>
        <button type='button' className='btn btn-secondary' onClick={closeModal}>
          Cancel
        </button>
        <button
          type='submit'
          className='btn btn-primary'
          onClick={handleSignUp}
        >
          Sign up
        </button>
      </div>
    </Modal>
  );
};

const LoginModal = () => {
  const { closeModal, currentModal, openModal } = useContext(ModalsContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [valid, setValid] = useState('');
  const [feedback, setFeedback] = useState('');

  if (currentModal !== ModalTypes.LOGIN) return null;

  const handleLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (!user.emailVerified) {
        await signOut(auth);
        setValid('is-invalid');
        setFeedback('Please verify your email before logging in.');
      } else {
        setValid('is-valid');
        setFeedback('Login successful!');
        setTimeout(() => {
          closeModal();
          setValid('');
          setFeedback('');
        }, 1000);
      }
    } catch (error) {
      setValid('is-invalid');
      setFeedback('Error logging in. Please check your credentials.');
      console.error('Error logging in:', error);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'email') setEmail(value);
    if (name === 'password') setPassword(value);
    setValid('');
    setFeedback('');
  };

  const handleForgotPassword = () => {
    closeModal();
    openModal(ModalTypes.FORGOT_PASSWORD);
  };

  return (
    <Modal type={ModalTypes.LOGIN} title="Login to Markatplace Auction">
      <div className='modal-body'>
        <form onSubmit={(e) => e.preventDefault()}>
          <div className='form-floating mb-3'>
            <input
              autoFocus
              id='email-input'
              type='email'
              name='email'
              className={`form-control ${valid}`}
              value={email}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder='Enter your email'
            />
            <label>Email</label>
          </div>
          <div className='form-floating mb-3'>
            <input
              id='password-input'
              type='password'
              name='password'
              className={`form-control ${valid}`}
              value={password}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder='Enter your password'
            />
            <label>Password</label>
          </div>
          <div className={`invalid-feedback ${valid === 'is-invalid' ? 'd-block' : ''}`}>
            {feedback}
          </div>
          <div className="text-end">
            <button type="button" className="btn btn-link p-0" onClick={handleForgotPassword}>
              Forgot Password?
            </button>
          </div>
        </form>
      </div>
      <div className='modal-footer'>
        <button type='button' className='btn btn-secondary' onClick={closeModal}>
          Cancel
        </button>
        <button
          type='submit'
          className='btn btn-primary'
          onClick={handleLogin}
        >
          Login
        </button>
      </div>
    </Modal>
  );
};

const ForgotPasswordModal = () => {
  const { closeModal, currentModal } = useContext(ModalsContext);
  const [email, setEmail] = useState('');
  const [valid, setValid] = useState('');
  const [feedback, setFeedback] = useState('');

  if (currentModal !== ModalTypes.FORGOT_PASSWORD) return null;

  const handlePasswordReset = async () => {
    try {
      await sendPasswordResetEmail(auth, email);
      setValid('is-valid');
      setFeedback('Password reset email sent!');
      setTimeout(() => {
        closeModal();
        setValid('');
        setFeedback('');
      }, 1000);
    } catch (error) {
      setValid('is-invalid');
      setFeedback('Error sending password reset email. Please try again.');
      console.error('Error sending password reset email:', error);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handlePasswordReset();
    }
  };

  const handleChange = (e) => {
    setEmail(e.target.value);
    setValid('');
    setFeedback('');
  };

  return (
    <Modal type={ModalTypes.FORGOT_PASSWORD} title='Reset your password'>
      <div className='modal-body'>
        <p>Enter your email address to receive a password reset email.</p>
        <form onSubmit={(e) => e.preventDefault()}>
          <div className='form-floating mb-3'>
            <input
              autoFocus
              id='email-input'
              type='email'
              name='email'
              className={`form-control ${valid}`}
              value={email}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder='Enter your email'
            />
            <label>Email</label>
          </div>
          <div className={`invalid-feedback ${valid === 'is-invalid' ? 'd-block' : ''}`}>
            {feedback}
          </div>
        </form>
      </div>
      <div className='modal-footer'>
        <button type='button' className='btn btn-secondary' onClick={closeModal}>
          Cancel
        </button>
        <button
          type='submit'
          className='btn btn-primary'
          onClick={handlePasswordReset}
        >
          Send email
        </button>
      </div>
    </Modal>
  );
};

export { ItemModal, SignUpModal, LoginModal, ForgotPasswordModal };
