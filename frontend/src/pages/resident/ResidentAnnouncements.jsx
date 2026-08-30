import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { Megaphone, Calendar, Tag } from 'lucide-react';

const ResidentAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const res = await api.get('/announcements');
        if (res.data?.success) setAnnouncements(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnnouncements();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Complex Notices & Announcements</h2>
        <p className="text-xs sm:text-sm text-slate-500">Official updates from building administration</p>
      </div>

      <div className="space-y-4">
        {announcements.length === 0 ? (
          <div className="p-8 bg-white rounded-3xl border border-slate-200 text-center text-slate-400 text-xs shadow-xs">
            No announcements published currently.
          </div>
        ) : (
          announcements.map((ann) => (
            <div key={ann._id} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-50 text-brand-700 uppercase">
                    {ann.category?.replace(/_/g, ' ')}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {new Date(ann.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <span className="text-[11px] font-medium text-slate-500">
                  Posted by: <strong>{ann.createdByName}</strong>
                </span>
              </div>

              <h3 className="text-base font-bold text-slate-900">{ann.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{ann.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ResidentAnnouncements;
