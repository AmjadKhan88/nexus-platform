import React, { useRef, useState } from 'react';
import { User, Lock, Bell, Globe, Palette, CreditCard, Upload } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import toast from 'react-hot-toast';

type SettingsTab = 'profile' | 'security' | 'notifications' | '2fa';

export const SettingsPage: React.FC = () => {
  const { user,setUser, updateProfileManuly,updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [saving, setSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showPassword,setShowPassword] = useState(false);
  const [error,setError] = useState<any>({});

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    location: (user as any)?.location || '',
    // Entrepreneur fields
    startupName: (user as any)?.startupName || '',
    pitchSummary: (user as any)?.pitchSummary || '',
    fundingNeeded: (user as any)?.fundingNeeded || '',
    industry: (user as any)?.industry || '',
    foundedYear: (user as any)?.foundedYear || '',
    teamSize: (user as any)?.teamSize || '',
    // Investor fields
    minimumInvestment: (user as any)?.minimumInvestment || '',
    maximumInvestment: (user as any)?.maximumInvestment || '',
    totalInvestments: (user as any)?.totalInvestments || '',
    investmentInterests: (user as any)?.investmentInterests?.join(', ') || '',
    investmentStage: (user as any)?.investmentStage?.join(', ') || '',
  });

  // Password form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // 2FA
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  // Notification prefs (UI only for now)
  const [notifications, setNotifications] = useState({
    emailMessages: true,
    emailCollaborations: true,
    emailMeetings: true,
    pushAll: false,
  });

  if (!user) return null;

  // ── Profile Save ────────────────────────────────────────────────────────────
  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const updates: any = {
        name: profileForm.name,
        bio: profileForm.bio,
        location: profileForm.location,
      };

      if (user.role === 'entrepreneur') {
        updates.startupName = profileForm.startupName;
        updates.pitchSummary = profileForm.pitchSummary;
        updates.fundingNeeded = profileForm.fundingNeeded;
        updates.industry = profileForm.industry;
        updates.foundedYear = profileForm.foundedYear ? Number(profileForm.foundedYear) : undefined;
        updates.teamSize = profileForm.teamSize ? Number(profileForm.teamSize) : undefined;
      }

      if (user.role === 'investor') {
        updates.minimumInvestment = profileForm.minimumInvestment;
        updates.maximumInvestment = profileForm.maximumInvestment;
        updates.totalInvestments = profileForm.totalInvestments ? Number(profileForm.totalInvestments) : undefined;
        updates.investmentInterests = profileForm.investmentInterests
          .split(',').map((s) => s.trim()).filter(Boolean);
        updates.investmentStage = profileForm.investmentStage
          .split(',').map((s) => s.trim()).filter(Boolean);
      }

      await updateProfile((user as any)._id || (user as any).id, updates);
    } finally {
      setSaving(false);
    }
  };

  // ── Avatar Upload ────────────────────────────────────────────────────────────
const fileInputRef = useRef<HTMLInputElement>(null);

const handleButtonClick = () => {
  fileInputRef.current?.click();
};
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  // Validate file type
  if (!file.type.startsWith('image/')) {
    toast.error('Please upload an image file');
    e.target.value = '';
    return;
  }

  // Validate file size (5MB)
  if (file.size > 5 * 1024 * 1024) {
    toast.error('File too large. Max 5MB');
    e.target.value = '';
    return;
  }

  const formData = new FormData();
  formData.append('avatar', file);

  setIsUploading(true);
  try {
    const {data} = await api.put('/users/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    if(data.success){
    toast.success('Avatar updated successfully');
    e.target.value = ''; // Reset input
    // Update only the avatarUrl in user state
    setUser((prev:any) => ({ 
      ...prev, 
      avatarUrl: data.avatarUrl
    }));
    updateProfileManuly();
  }
  } catch (error) {
    console.error('Avatar upload error:', error);
    toast.error('Failed to update avatar');
  } finally {
    setIsUploading(false);
  }
};

  // ── Password Change ─────────────────────────────────────────────────────────
  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setSaving(true);
    try {
     const {data} = await api.put('/users/change-password', {
        password: passwordForm.newPassword,
        currentPassword: passwordForm.currentPassword,
      });
      if(data.success){
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        toast.success(data.message);
        setError({});
      }
    } catch (err: any) {
      setError(err.response?.data?.error || {})
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  // ── 2FA ─────────────────────────────────────────────────────────────────────
  const handleSendOTP = async () => {
    try {
      await api.post('/auth/send-otp');
      setOtpSent(true);
      toast.success('OTP sent to your email');
    } catch {
      toast.error('Failed to send OTP');
    }
  };

  const handleVerifyOTP = async () => {
    try {
      await api.post('/auth/verify-otp', { otp });
      setOtp('');
      setOtpSent(false);
      toast.success('2FA enabled successfully!');
    } catch {
      toast.error('Invalid or expired OTP');
    }
  };

  // ── Sidebar nav items ───────────────────────────────────────────────────────
  const navItems: { key: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { key: 'profile', label: 'Profile', icon: <User size={18} /> },
    { key: 'security', label: 'Security', icon: <Lock size={18} /> },
    { key: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
    { key: '2fa', label: '2FA Setup', icon: <CreditCard size={18} /> },
  ];

  console.log(user)
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your account preferences and settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar nav */}
        <Card className="lg:col-span-1 h-fit">
          <CardBody className="p-2">
            <nav className="space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.key}
                  onClick={() => setActiveTab(item.key)}
                  className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === item.key
                      ? 'text-primary-700 bg-primary-50'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </nav>
          </CardBody>
        </Card>

        {/* Main content */}
        <div className="lg:col-span-3 space-y-6">

          {/* ── PROFILE TAB ──────────────────────────────────────────────────── */}
          {activeTab === 'profile' && (
            <>
              {/* Avatar */}
              <Card>
                <CardHeader><h2 className="text-lg font-medium text-gray-900">Profile Photo</h2></CardHeader>
                <CardBody>
                  <div className="flex items-center gap-6">
                    <Avatar src={user.avatarUrl} alt={user.name} size="xl" />
                    <div>
                      <label className="cursor-pointer" htmlFor='avatar'>
                        <input type="file" ref={fileInputRef} id='avatar' className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                        <Button variant="outline" disabled={isUploading} onClick={handleButtonClick}  leftIcon={<Upload size={16} />} as="span">
                         {isUploading ? 'Uploading' :'Upload New Photo' }
                        </Button>
                      </label>
                      <p className="text-xs text-gray-500 mt-2">JPG, PNG or SVG. Max 10MB.</p>
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* Basic Info */}
              <Card>
                <CardHeader><h2 className="text-lg font-medium text-gray-900">Basic Information</h2></CardHeader>
                <CardBody className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                      <Input
                        value={profileForm.name}
                        onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                        fullWidth
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                      <Input
                        value={profileForm.location}
                        onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                        placeholder="City, Country"
                        fullWidth
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                    <textarea
                      value={profileForm.bio}
                      onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                      rows={4}
                      maxLength={500}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                      placeholder="Tell investors/entrepreneurs about yourself..."
                    />
                    <p className="text-xs text-gray-400 mt-1">{profileForm.bio.length}/500</p>
                  </div>
                </CardBody>
              </Card>

              {/* Role-specific fields */}
              {user.role === 'entrepreneur' && (
                <Card>
                  <CardHeader><h2 className="text-lg font-medium text-gray-900">Startup Details</h2></CardHeader>
                  <CardBody className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Startup Name</label>
                        <Input
                          value={profileForm.startupName}
                          onChange={(e) => setProfileForm({ ...profileForm, startupName: e.target.value })}
                          fullWidth
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                        <Input
                          value={profileForm.industry}
                          onChange={(e) => setProfileForm({ ...profileForm, industry: e.target.value })}
                          placeholder="e.g. FinTech, HealthTech"
                          fullWidth
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Funding Needed</label>
                        <Input
                          value={profileForm.fundingNeeded}
                          onChange={(e) => setProfileForm({ ...profileForm, fundingNeeded: e.target.value })}
                          placeholder="e.g. $500K"
                          fullWidth
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Founded Year</label>
                        <Input
                          type="number"
                          value={profileForm.foundedYear}
                          onChange={(e) => setProfileForm({ ...profileForm, foundedYear: e.target.value })}
                          placeholder="e.g. 2022"
                          fullWidth
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Team Size</label>
                        <Input
                          type="number"
                          value={profileForm.teamSize}
                          onChange={(e) => setProfileForm({ ...profileForm, teamSize: e.target.value })}
                          placeholder="e.g. 5"
                          fullWidth
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Pitch Summary</label>
                      <textarea
                        value={profileForm.pitchSummary}
                        onChange={(e) => setProfileForm({ ...profileForm, pitchSummary: e.target.value })}
                        rows={3}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                        placeholder="Briefly describe your startup and value proposition..."
                      />
                    </div>
                  </CardBody>
                </Card>
              )}

              {user.role === 'investor' && (
                <Card>
                  <CardHeader><h2 className="text-lg font-medium text-gray-900">Investment Details</h2></CardHeader>
                  <CardBody className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Investment</label>
                        <Input
                          value={profileForm.minimumInvestment}
                          onChange={(e) => setProfileForm({ ...profileForm, minimumInvestment: e.target.value })}
                          placeholder="e.g. $50K"
                          fullWidth
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Investment</label>
                        <Input
                          value={profileForm.maximumInvestment}
                          onChange={(e) => setProfileForm({ ...profileForm, maximumInvestment: e.target.value })}
                          placeholder="e.g. $2M"
                          fullWidth
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Total Investments Made</label>
                        <Input
                          type="number"
                          value={profileForm.totalInvestments}
                          onChange={(e) => setProfileForm({ ...profileForm, totalInvestments: e.target.value })}
                          placeholder="e.g. 12"
                          fullWidth
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Investment Interests <span className="text-gray-400 font-normal">(comma-separated)</span>
                      </label>
                      <Input
                        value={profileForm.investmentInterests}
                        onChange={(e) => setProfileForm({ ...profileForm, investmentInterests: e.target.value })}
                        placeholder="e.g. FinTech, HealthTech, SaaS"
                        fullWidth
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Investment Stages <span className="text-gray-400 font-normal">(comma-separated)</span>
                      </label>
                      <Input
                        value={profileForm.investmentStage}
                        onChange={(e) => setProfileForm({ ...profileForm, investmentStage: e.target.value })}
                        placeholder="e.g. Pre-seed, Seed, Series A"
                        fullWidth
                      />
                    </div>
                  </CardBody>
                </Card>
              )}

              <div className="flex justify-end">
                <Button onClick={handleSaveProfile} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </>
          )}

          {/* ── SECURITY TAB ─────────────────────────────────────────────────── */}
          {activeTab === 'security' && (
            <Card>
              <CardHeader><h2 className="text-lg font-medium text-gray-900">Change Password</h2></CardHeader>
              <CardBody className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    placeholder="Enter current password"
                    fullWidth
                  />
                  {error.password &&  <p className='text-xs text-red-500'>{error.password}</p> }
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    placeholder="At least 6 characters"
                    fullWidth
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    placeholder="Repeat new password"
                    fullWidth
                  />
                </div>
                <div className="flex justify-between items-center pt-2">
                  <label htmlFor='showPassword' className='flex items-center text-gray-600'><input type='checkbox' onChange={()=> setShowPassword(prev=> !prev)} id='showPassword' className='me-2'/>show password</label>
                  <Button
                    onClick={handleChangePassword}
                    disabled={saving || !passwordForm.currentPassword || !passwordForm.newPassword}
                  >
                    {saving ? 'Updating...' : 'Update Password'}
                  </Button>
                </div>
              </CardBody>
            </Card>
          )}

          {/* ── NOTIFICATIONS TAB ────────────────────────────────────────────── */}
          {activeTab === 'notifications' && (
            <Card>
              <CardHeader><h2 className="text-lg font-medium text-gray-900">Notification Preferences</h2></CardHeader>
              <CardBody className="space-y-4">
                {[
                  { key: 'emailMessages', label: 'New Messages', desc: 'Get notified when someone sends you a message' },
                  { key: 'emailCollaborations', label: 'Collaboration Requests', desc: 'Get notified of new collaboration requests' },
                  { key: 'emailMeetings', label: 'Meeting Invitations', desc: 'Get notified when a meeting is scheduled' },
                  { key: 'pushAll', label: 'Browser Notifications', desc: 'Enable push notifications in browser' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                    </div>
                    <button
                      onClick={() => setNotifications((prev) => ({ ...prev, [item.key]: !(prev as any)[item.key] }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        (notifications as any)[item.key] ? 'bg-primary-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          (notifications as any)[item.key] ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                ))}
                <div className="flex justify-end pt-2">
                  <Button onClick={() => toast.success('Notification preferences saved')}>
                    Save Preferences
                  </Button>
                </div>
              </CardBody>
            </Card>
          )}

          {/* ── 2FA TAB ─────────────────────────────────────────────────────── */}
          {activeTab === '2fa' && (
            <Card>
              <CardHeader><h2 className="text-lg font-medium text-gray-900">Two-Factor Authentication</h2></CardHeader>
              <CardBody className="space-y-6">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>2FA</strong> adds an extra layer of security to your account. After enabling,
                    you'll receive a one-time code to your email when logging in.
                  </p>
                </div>

                {(user as any).twoFAEnabled ? (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800 font-medium">✅ Two-Factor Authentication is enabled</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Click "Send OTP" to receive a one-time code at <strong>{user.email}</strong>.
                      Enter it below to activate 2FA.
                    </p>
                    <div className="flex gap-3">
                      <Button variant="outline" onClick={handleSendOTP} disabled={otpSent}>
                        {otpSent ? 'OTP Sent ✓' : 'Send OTP'}
                      </Button>
                    </div>
                    {otpSent && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Enter OTP</label>
                          <Input
                            type="text"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            placeholder="6-digit code"
                            maxLength={6}
                            fullWidth
                          />
                        </div>
                        <Button onClick={handleVerifyOTP} disabled={otp.length !== 6}>
                          Verify & Enable 2FA
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardBody>
            </Card>
          )}

        </div>
      </div>
    </div>
  );
};
