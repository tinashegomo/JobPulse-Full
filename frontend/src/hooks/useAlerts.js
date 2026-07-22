import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './useAuth';
import { createAlert, updateAlert, deleteAlert } from '../api/firestoreService';

export const useAlerts = () => {
  const { currentUser } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'search_alerts'),
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const alertsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setAlerts(alertsData);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  const addAlert = async (alertData) => {
    try {
      await createAlert({ ...alertData, userId: currentUser.uid });
    } catch (err) {
      setError(err.message);
    }
  };

  const editAlert = async (alertId, alertData) => {
    try {
      await updateAlert(alertId, alertData);
    } catch (err) {
      setError(err.message);
    }
  };

  const removeAlert = async (alertId) => {
    try {
      await deleteAlert(alertId);
    } catch (err) {
      setError(err.message);
    }
  };

  return { alerts, loading, error, addAlert, editAlert, removeAlert };
};
