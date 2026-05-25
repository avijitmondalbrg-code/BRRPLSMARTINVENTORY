import React, { useState, useEffect } from 'react';
import { AppUser, UserRole } from '../types';
import { fetchCollection, setDocument, deleteDocument } from '../services/firebase';
import { User, Shield, Search, Plus, Trash2, Edit2, ShieldAlert, CheckCircle2, XCircle, ArrowLeft, Key, Lock, Eye, EyeOff } from 'lucide-react';

interface UsersAdminProps {
  userRole: UserRole;
  currentUserId: string;
  onNavigateBack: () => void;
  backHandlerRef?: React.MutableRefObject<(() => boolean) | null>;
}

export const UsersAdmin: React.FC<UsersAdminProps> = ({ userRole, currentUserId, onNavigateBack, backHandlerRef }) => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form State
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'user'>('user');
  const [status, setStatus] = useState<'Active' | 'Blocked'>('Active');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!backHandlerRef) return;
    const handler = () => {
      if (showModal) {
        setShowModal(false);
        return true;
      }
      return false;
    };
    backHandlerRef.current = handler;
    return () => {
      if (backHandlerRef.current === handler) {
        backHandlerRef.current = null;
      }
    };
  }, [showModal, backHandlerRef]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await fetchCollection('users');
      setUsers(data as AppUser[]);
    } catch (err) {
      console.error("Error loading users database:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  if (userRole !== 'admin') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-3xl p-8 max-w-xl mx-auto text-center my-12 shadow-md">
        <ShieldAlert className="mx-auto text-rose-600 mb-4" size={48} />
        <h3 className="text-lg font-black text-rose-800 uppercase tracking-wider">প্রবেশাধিকার নিষিদ্ধ (Access Denied)</h3>
        <p className="text-xs text-rose-700 font-semibold mt-2">
          এই বিভাগটি শুধুমাত্র অ্যাডমিনদের জন্য সংরক্ষিত। অনুগ্রহ করে সঠিক অ্যাকাউন্ট দিয়ে লগইন করুন।
        </p>
        <button 
          onClick={onNavigateBack}
          className="mt-6 px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold uppercase transition"
        >
          ফিরে যান
        </button>
      </div>
    );
  }

  const handleOpenAdd = () => {
    setEditingUserId(null);
    setUsername('');
    setName('');
    setPassword('');
    setRole('user');
    setStatus('Active');
    setError('');
    setSuccess('');
    setShowModal(true);
  };

  const handleOpenEdit = (user: AppUser) => {
    setEditingUserId(user.id);
    setUsername(user.username);
    setName(user.name);
    setPassword(user.password || '');
    setRole(user.role);
    setStatus(user.status);
    setError('');
    setSuccess('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const cleanUsername = username.trim().toLowerCase();
    const cleanName = name.trim();
    const cleanPassword = password.trim();

    if (!cleanUsername || !cleanName || !cleanPassword) {
      setError("দয়া করে সব ফিল্ড বা তথ্য পূরণ করুন।");
      return;
    }

    if (!/^[a-z0-9_-]+$/i.test(cleanUsername)) {
      setError("ইউজার আইডি তে শুধুমাত্র ছোট অক্ষরের ইংরেজি ও সংখ্যা থাকবে (কোনো স্পেস থাকবে না)।");
      return;
    }

    // Check duplicate username if adding new
    if (!editingUserId) {
      const exists = users.some(u => u.username.toLowerCase() === cleanUsername);
      if (exists || cleanUsername === 'admin' || cleanUsername === 'user') {
        setError("এই ইউজার আইডিটি ইতিমধ্যে ব্যবহার করা হয়েছে। অন্য আইডি নির্বাচন করুন।");
        return;
      }
    }

    const userData: AppUser = {
      id: cleanUsername,
      username: cleanUsername,
      name: cleanName,
      password: cleanPassword,
      role,
      status,
      addedDate: editingUserId ? (users.find(u => u.id === editingUserId)?.addedDate || new Date().toISOString().split('T')[0]) : new Date().toISOString().split('T')[0]
    };

    try {
      await setDocument('users', cleanUsername, userData);
      setSuccess(editingUserId ? "ব্যবহারকারীর তথ্য সফলভাবে আপডেট হয়েছে।" : "নতুন ব্যবহারকারী সফলভাবে তৈরি করা হয়েছে।");
      
      // If the admin modified their own role/status/password, explain it
      if (cleanUsername === currentUserId && (status === 'Blocked' || role !== 'admin')) {
        setSuccess("আপনার নিজের অ্যাকাউন্টের অ্যাক্সেস পরিবর্তন করা হয়েছে। সিস্টেম রিলোড হতে পারে।");
      }

      await loadUsers();
      setTimeout(() => setShowModal(false), 1200);
    } catch (err: any) {
      setError("ব্যবহারকারী সংরক্ষণ করা যায়নি: " + err.message);
    }
  };

  const handleDelete = async (userToDelete: AppUser) => {
    if (currentUserId !== 'admin') {
      alert("দুঃখিত, শুধুমাত্র মুখ্য System Administrator (admin) অ্যাকাউন্টগুলি ডিলিট করতে পারবেন।");
      return;
    }

    if (userToDelete.id === currentUserId || userToDelete.username === 'admin') {
      alert("আপনি নিজের অ্যাকাউন্ট অথবা মুখ্য সিস্টেম অ্যাডমিন অ্যাকাউন্ট ডিলিট করতে পারবেন না।");
      return;
    }

    if (window.confirm(`আপনি কি নিশ্চিতভাবে "${userToDelete.name}" ব্যবহারকারীকে ডিলিট করতে চান?`)) {
      try {
        await deleteDocument('users', userToDelete.id);
        await loadUsers();
      } catch (err: any) {
        alert("ডিলিট করতে ত্রুটি হয়েছে: " + err.message);
      }
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight uppercase">User Access Control Panel</h1>
          <p className="text-xs text-gray-500 font-bold mt-1 uppercase tracking-wider text-[#3159a6]">অ্যাডমিন প্যানেল • ব্যবহারকারী এবং রাইটস ম্যানেজমেন্ট</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 bg-[#3159a6] hover:bg-blue-800 text-white px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg hover:shadow-blue-200 transition duration-150 transform hover:-translate-y-0.5"
          >
            <Plus size={16} />
            <span>নতুন ইউজার যোগ করুন</span>
          </button>
        </div>
      </div>

      {/* Stats Counter Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl p-6 border shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase text-gray-400">Total System Users</p>
            <p className="text-2xl font-black text-slate-800">{users.length + 2}</p>
          </div>
          <div className="bg-blue-50 p-3.5 rounded-2xl text-[#3159a6]">
            <User size={24} />
          </div>
        </div>
        <div className="bg-white rounded-3xl p-6 border shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase text-gray-400">Administrators</p>
            <p className="text-2xl font-black text-blue-600">{users.filter(u => u.role === 'admin').length + 1}</p>
          </div>
          <div className="bg-emerald-50 p-3.5 rounded-2xl text-emerald-600">
            <Shield size={24} />
          </div>
        </div>
        <div className="bg-white rounded-3xl p-6 border shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase text-gray-400">Database Registered Accounts</p>
            <p className="text-2xl font-black text-slate-700">{users.length}</p>
          </div>
          <div className="bg-amber-50 p-3.5 rounded-2xl text-amber-600">
            <Lock size={24} />
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
        <div className="p-6 border-b flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/50">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="ইউজার বা নাম দিয়ে সার্চ করুন..."
              className="w-full pl-11 pr-4 py-2.5 border rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-primary bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase">সিস্টেমের নিরাপত্তার স্বার্থে পাসওয়ার্ডগুলি সুরক্ষিত রাখুন</p>
        </div>

        {loading ? (
          <div className="p-16 text-center text-gray-400 font-bold text-xs uppercase tracking-widest bg-white">
            <div className="h-8 w-8 border-4 border-dashed border-[#3159a6] rounded-full animate-spin mx-auto mb-4"></div>
            অ্যাকাউন্ট তালিকা লোড হচ্ছে...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b bg-gray-50/50 text-[10px] uppercase font-black text-gray-400 tracking-wider">
                  <th className="py-4 px-6">User ID / Username</th>
                  <th className="py-4 px-6">Staff Name</th>
                  <th className="py-4 px-6">Access Role</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Added Date</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y text-xs font-semibold text-slate-700">
                {/* Static Main Admin Row */}
                <tr className="hover:bg-slate-50/50 transition">
                  <td className="py-4 px-6">
                    <div className="font-black text-slate-900 flex items-center gap-2">
                       <span className="p-1.5 bg-blue-50 text-[#3159a6] rounded-lg"><User size={12}/></span>
                       <span>admin</span>
                       <span className="text-[8px] bg-indigo-50 border border-indigo-200 text-indigo-700 font-black px-1.5 py-0.5 rounded uppercase tracking-widest">Master Direct</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 font-bold">System Administrator</td>
                  <td className="py-4 px-6">
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-[#3159a6] text-white font-black text-[9px] uppercase tracking-wider">
                      <Shield size={10} /> admin
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase">
                      ● Active
                    </span>
                  </td>
                  <td className="py-4 px-6 text-gray-400 uppercase font-bold text-[10px]">— System —</td>
                  <td className="py-4 px-6 text-right font-black text-[10px] text-gray-400 uppercase">সুরক্ষিত (Protected)</td>
                </tr>

                {/* Database Users */}
                {filteredUsers.length === 0 ? (
                  users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 px-6 text-center text-gray-400 font-bold uppercase text-[10px] tracking-wider">
                        কোনো নিজস্ব ব্যবহারকারী অ্যাকাউন্ট তৈরি করা নেই। উপরে ডানদিকের বাটনটিতে ক্লিক করে প্রথম ইউজার তৈরি করুন।
                      </td>
                    </tr>
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-12 px-6 text-center text-gray-400 font-bold uppercase text-[10px] tracking-wider">
                        সার্চ ফলাফলে কোনো মিল পাওয়া যায়নি।
                      </td>
                    </tr>
                  )
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50/50 transition duration-150">
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-800 flex items-center gap-2">
                           <span className="p-1.5 bg-slate-100 text-slate-500 rounded-lg"><User size={12}/></span>
                           <span>{user.username}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 font-bold">{user.name}</td>
                      <td className="py-4 px-6">
                        {user.role === 'admin' ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-[#3159a6] text-white font-black text-[9px] uppercase tracking-wider">
                            <Shield size={10} /> admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-slate-100 text-slate-600 font-black text-[9px] uppercase tracking-wider">
                            <User size={10} /> staff / user
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        {user.status === 'Active' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase">
                            ● Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-100 uppercase">
                            ● Blocked
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-gray-500 font-mono text-[10px]">{user.addedDate || 'Not specified'}</td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => handleOpenEdit(user)}
                            className="p-2 bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-[#3159a6] rounded-lg transition"
                            title="Edit User Info"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => handleDelete(user)}
                            disabled={user.id === currentUserId || currentUserId !== 'admin'}
                            className={`p-2 rounded-lg transition ${
                              user.id === currentUserId || currentUserId !== 'admin'
                                ? 'bg-slate-50 text-gray-300 cursor-not-allowed opacity-50'
                                : 'bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600'
                            }`}
                            title={currentUserId !== 'admin' ? "শুধুমাত্র মুখ্য System Administrator ডিলিট করতে পারবেন" : "Delete User"}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full border overflow-hidden p-8 animate-fade-in space-y-6">
            <div className="flex justify-between items-start border-b pb-4">
              <div>
                <h3 className="text-base font-black text-slate-800 uppercase tracking-tight">
                  {editingUserId ? 'ইউজারের তথ্য সংশোধন করুন' : 'নতুন ব্যবহারকারী যোগ করুন'}
                </h3>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider mt-0.5">Define Username & Role Right</p>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <XCircle size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400 ml-1">User ID / Username</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                  <input
                    type="text"
                    required
                    disabled={editingUserId !== null}
                    placeholder="e.g. avijit, sumit (স্পেস ও বড় হাতের অক্ষর দেয়া যাবে না)"
                    className="w-full pl-9 pr-4 py-2 border-2 border-slate-100 rounded-xl text-xs font-bold outline-none focus:border-[#3159a6] disabled:bg-slate-50 disabled:text-gray-400"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Full Name (স্টাফের পূর্ণ নাম)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Avijit Mondal"
                  className="w-full px-4 py-2 border-2 border-slate-100 rounded-xl text-xs font-bold outline-none focus:border-[#3159a6]"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Secure Password</label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    className="w-full pl-9 pr-9 py-2 border-2 border-slate-100 rounded-xl text-xs font-bold outline-none focus:border-[#3159a6]"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Assign rights</label>
                  <select
                    className="w-full px-4 py-2 border-2 border-slate-100 rounded-xl text-xs font-bold outline-none focus:border-[#3159a6] bg-white"
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                  >
                    <option value="user">Staff / User (সীমিত এক্সেস)</option>
                    <option value="admin">Administrator (পূর্ণ এক্সেস)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Status (অ্যাকাউন্ট সক্রিয়তা)</label>
                  <select
                    className="w-full px-4 py-2 border-2 border-slate-100 rounded-xl text-xs font-bold outline-none focus:border-[#3159a6] bg-white"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                  >
                    <option value="Active">সক্রিয় (Active)</option>
                    <option value="Blocked">নিষ্ক্রিয় / ব্লকড (Blocked)</option>
                  </select>
                </div>
              </div>

              {error && (
                <div className="bg-rose-50 text-rose-600 font-bold text-[11px] p-3 rounded-xl border border-rose-100 flex items-center gap-2">
                  <XCircle size={14} />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="bg-emerald-50 text-emerald-700 font-bold text-[11px] p-3 rounded-xl border border-emerald-100 flex items-center gap-2">
                  <CheckCircle2 size={14} />
                  <span>{success}</span>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-1/2 py-2.5 border-2 rounded-xl text-xs font-bold uppercase text-slate-500 hover:bg-slate-50 transition"
                >
                  বাতিল করুন
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-[#3159a6] hover:bg-blue-800 text-white rounded-xl text-xs font-black uppercase transition shadow-md"
                >
                  সংরক্ষণ করুন (Save)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
