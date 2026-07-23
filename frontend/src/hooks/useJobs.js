import { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './useAuth';

export const useJobs = () => {
  const { currentUser } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!currentUser) return;

    let jobsData = [];
    let userStates = {};

    function merge() {
      const merged = jobsData
        .filter((job) => {
          const key = `${job.source}_${job.externalJobId}`;
          const state = userStates[key];
          return !state?.hidden;
        })
        .filter((job) => {
          const title = (job.title || '').toLowerCase();
          return title !== 'hire feed';
        })
        .map((job) => {
          const key = `${job.source}_${job.externalJobId}`;
          const state = userStates[key];
          return { ...job, seen: state?.seen || false };
        });
      setJobs(merged);
      setLoading(false);
    }

    const jobsQuery = query(collection(db, 'jobs'), orderBy('dateDetected', 'desc'));
    const unsubJobs = onSnapshot(
      jobsQuery,
      (snapshot) => {
        jobsData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        merge();
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    const statesQuery = query(
      collection(db, 'notified_jobs'),
      where('userId', '==', currentUser.uid)
    );
    const unsubStates = onSnapshot(
      statesQuery,
      (snapshot) => {
        userStates = {};
        for (const doc of snapshot.docs) {
          const data = doc.data();
          const key = `${data.source}_${data.externalJobId}`;
          userStates[key] = { seen: !!data.seen, hidden: !!data.hidden };
        }
        merge();
      },
      (err) => setError(err.message)
    );

    return () => {
      unsubJobs();
      unsubStates();
    };
  }, [currentUser]);

  return { jobs, loading, error };
};
