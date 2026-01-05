import { db } from "../firebase";
import { 
  collection, addDoc, getDocs, updateDoc, doc 
} from "firebase/firestore";

// Add a service
export const addService = async (service) => {
  await addDoc(collection(db, "services"), service);
};

// Fetch all services
export const getAllServices = async () => {
  const snapshot = await getDocs(collection(db, "services"));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Update availability
export const updateServiceStatus = async (id, status) => {
  const ref = doc(db, "services", id);
  await updateDoc(ref, { available: status });
};
