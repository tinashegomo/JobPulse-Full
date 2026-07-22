import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { getKeywords, addKeyword, deleteKeyword } from '../api/firestoreService';

export const useKeywords = () => {
  const { currentUser } = useAuth();
  const [keywords, setKeywords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    let cancelled = false;

    getKeywords(currentUser.uid)
      .then((data) => {
        if (!cancelled) {
          setKeywords(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [currentUser]);

  const save = async (keyword) => {
    if (!currentUser || !keyword.trim()) return;
    await addKeyword(currentUser.uid, keyword.trim());
    const data = await getKeywords(currentUser.uid);
    setKeywords(data);
  };

  const remove = async (keywordId) => {
    await deleteKeyword(keywordId);
    setKeywords((prev) => prev.filter((k) => k.id !== keywordId));
  };

  return { keywords, loading, save, remove };
};
