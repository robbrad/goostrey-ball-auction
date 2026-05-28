import {
  getDoc,
  updateDoc,
  doc,
  Timestamp,
  deleteField,
} from "firebase/firestore";
import { db } from "./config";
import yaml from "js-yaml";
import { formatField } from "../utils/formatString";

export const parseField = (key) => {
    const match = key.match(/item(\d+)_bid(\d+)/);
    return {
      item: Number(match[1]),
      bid: Number(match[2]),
    };
  };

/**
 * Pure function that computes the updates object for editItems operations.
 * Extracted for testability without Firestore/fetch side effects.
 *
 * @param {Object} params
 * @param {Array} params.items - Array of new item config objects (each with an `id` field)
 * @param {string[]} params.fields - Array of field keys from the current Firestore document
 * @param {Object} params.currentDocData - The current document data (key-value map)
 * @param {boolean} params.update - Whether this is an update operation
 * @param {boolean} params.reset - Whether this is a reset operation
 * @param {*} params.deleteFieldSentinel - The sentinel value to use for field deletion
 * @returns {Object} The updates object to apply to Firestore
 */
export const computeEditUpdates = ({ items, fields, currentDocData, update, reset, deleteFieldSentinel }) => {
  const updates = {};
  items.forEach((newItem) => {
    fields
      .filter((field) => parseField(field).item === newItem.id)
      .forEach((field) => {
        if (update && parseField(field).bid === 0) {
          const existingData = currentDocData[field];
          const existingReservePrice = existingData?.reservePrice ?? null;
          updates[field] = { ...newItem, reservePrice: existingReservePrice };
        }
        if (reset && parseField(field).bid)
          updates[field] = deleteFieldSentinel;
      });
  });
  return updates;
};
  
export const unflattenItems = (doc, demo) => {
  let items = {};
  for (const [key, value] of Object.entries(doc.data())) {
    const { item, bid } = parseField(key);

    if (!(item in items)) items[item] = { bids: {} };

    if (bid === 0) {
      const { amount, endTime, reservePrice, ...itemData } = value;
      // Spread operator on `items[item]` in case bid 0 wasn't the first to be read
      items[item] = { ...items[item], ...itemData, startingPrice: amount, endTime: endTime.toDate(), reservePrice: reservePrice ?? null };
      if (demo) {
        const now = new Date();
        items[item].endTime = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          now.getHours(),
          items[item].endTime.getMinutes(),
          items[item].endTime.getSeconds()
        );
      }
    } else {
      items[item].bids[bid] = value;
    }
  }
  return Object.values(items);
};
  
/**
 * Pure function that computes the updates object for deleting an item.
 * Marks all fields matching the given item ID for deletion.
 *
 * @param {Object} params
 * @param {number} params.itemId - The item ID to delete
 * @param {string[]} params.fields - All field keys from the current Firestore document
 * @param {*} params.deleteFieldSentinel - The sentinel value for field deletion
 * @returns {Object} The updates object to apply to Firestore
 */
export const computeDeleteUpdates = ({ itemId, fields, deleteFieldSentinel }) => {
  const updates = {};
  fields
    .filter((field) => parseField(field).item === itemId)
    .forEach((field) => {
      updates[field] = deleteFieldSentinel;
    });
  return updates;
};

/**
 * Deletes all Firestore fields for a given item ID from the auction/items document.
 *
 * @param {number} itemId - The item ID to delete
 * @throws {Error} If the Firestore operation fails
 */
export const deleteItem = async (itemId) => {
  const docRef = doc(db, "auction", "items");
  const currentDoc = await getDoc(docRef);
  const fields = Object.keys(currentDoc.data());

  const updates = computeDeleteUpdates({
    itemId,
    fields,
    deleteFieldSentinel: deleteField(),
  });

  await updateDoc(docRef, updates);
};

export const editItems = async (id = undefined, update = false, reset = false) => {
  let response;
  try {
    response = await fetch(import.meta.env.BASE_URL + "items.yml");
    if (!response.ok) {
      const error = new Error("CONFIG_LOAD_FAILED");
      throw error;
    }
  } catch (err) {
    if (err.message === "CONFIG_LOAD_FAILED") throw err;
    const error = new Error("CONFIG_LOAD_FAILED");
    throw error;
  }

  const text = await response.text();
  let items = yaml.load(text);

  // If ID was provided, place that item in an array by itself
  if (id !== undefined) items = [items.find((item) => item.id === id)];

  const docRef = doc(db, "auction", "items");
  const currentDoc = await getDoc(docRef);
  console.debug("editItems() read from auction/items");

  let fields = Object.keys(currentDoc.data());
  if (fields.length === 0)
    fields = items.map((item) => formatField(item.id, 0));

  // Convert ISO dates into Firestore Timestamps
  items.forEach((newItem) => {
    newItem.endTime = Timestamp.fromDate(new Date(newItem.endTime));
  });

  const updates = computeEditUpdates({
    items,
    fields,
    currentDocData: currentDoc.data(),
    update,
    reset,
    deleteFieldSentinel: deleteField(),
  });

  await updateDoc(docRef, updates);
  console.debug("editItems() write to auction/items");
};
  