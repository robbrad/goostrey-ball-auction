import React, { useState, useEffect, useContext } from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import { itemStatus } from '../utils/itemStatus';
import { formatField, formatMoney } from '../utils/formatString';
import { validateName, validateBidAmount } from '../utils/validation';
import { createUserWithEmailAndPassword, updateProfile, signInWithEmailAndPassword, sendPasswordResetEmail, signOut, signInWithPopup, sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase/config';
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
        email: email.trim(),
        role: '',
        admin: '',
        createdAt: new Date(),
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
  const [emailLinkSent, setEmailLinkSent] = useState(false);

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

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      // Create user doc if it doesn't exist
      const userDocRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(userDocRef);
      if (!docSnap.exists()) {
        const nameParts = (user.displayName || '').split(' ');
        await setDoc(userDocRef, {
          firstName: nameParts[0] || '',
          surname: nameParts.slice(1).join(' ') || '',
          name: user.displayName || '',
          email: user.email || '',
          role: '',
          admin: '',
          createdAt: new Date(),
        });
      }
      setValid('is-valid');
      setFeedback('Login successful!');
      setTimeout(() => {
        closeModal();
        setValid('');
        setFeedback('');
      }, 1000);
    } catch (error) {
      setValid('is-invalid');
      setFeedback('Google sign-in failed. Please try again.');
      console.error('Google sign-in error:', error);
    }
  };

  const handleEmailLinkSignIn = async () => {
    if (!email) {
      setValid('is-invalid');
      setFeedback('Please enter your email address.');
      return;
    }
    try {
      const actionCodeSettings = {
        url: window.location.origin + import.meta.env.BASE_URL,
        handleCodeInApp: true,
      };
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      window.localStorage.setItem('emailForSignIn', email);
      setEmailLinkSent(true);
      setValid('is-valid');
      setFeedback('Sign-in link sent! Check your email.');
    } catch (error) {
      setValid('is-invalid');
      setFeedback('Error sending sign-in link. Please try again.');
      console.error('Email link error:', error);
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
    setEmailLinkSent(false);
  };

  const handleForgotPassword = () => {
    closeModal();
    openModal(ModalTypes.FORGOT_PASSWORD);
  };

  return (
    <Modal type={ModalTypes.LOGIN} title="Login to Markatplace Auction">
      <div className='modal-body'>
        <button
          type='button'
          className='btn btn-outline-dark w-100 mb-3 d-flex align-items-center justify-content-center gap-2'
          onClick={handleGoogleSignIn}
        >
          <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
          Sign in with Google
        </button>

        <div className='text-center mb-3'>
          <hr className='d-inline-block w-25 align-middle' />
          <span className='text-muted mx-2'>or</span>
          <hr className='d-inline-block w-25 align-middle' />
        </div>

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
          <div className={`valid-feedback ${valid === 'is-valid' ? 'd-block' : ''}`}>
            {feedback}
          </div>
          <div className="text-end">
            <button type="button" className="btn btn-link p-0" onClick={handleForgotPassword}>
              Forgot Password?
            </button>
          </div>
        </form>
      </div>
      <div className='modal-footer d-flex justify-content-between'>
        <button
          type='button'
          className='btn btn-outline-primary'
          onClick={handleEmailLinkSignIn}
          disabled={emailLinkSent}
        >
          {emailLinkSent ? 'Link sent ✓' : 'Send sign-in link'}
        </button>
        <div>
          <button type='button' className='btn btn-secondary me-2' onClick={closeModal}>
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
