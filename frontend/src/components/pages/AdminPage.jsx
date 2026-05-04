import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { API } from '../../utils/constants';

const AdminTabs = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'gallery', label: 'Gallery' },
    { id: 'discount-codes', label: 'Discount Codes' }
  ];

  return (
    <div className="flex gap-1 bg-white/5 rounded-xl p-1 mb-8" data-testid="admin-tabs">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
            activeTab === tab.id
              ? 'bg-white/10 text-white shadow-sm'
              : 'text-gray-400 hover:text-white'
          }`}
          data-testid={`admin-tab-${tab.id}`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

const GalleryPanel = () => {
  const [galleryImages, setGalleryImages] = useState([]);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newImageAlt, setNewImageAlt] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => { fetchGallery(); }, []);

  const fetchGallery = async () => {
    try {
      const response = await axios.get(`${API}/gallery`);
      setGalleryImages(response.data);
    } catch (error) {
      console.error("Failed to fetch gallery:", error);
    }
  };

  const handleAddImage = async (e) => {
    e.preventDefault();
    if (!newImageUrl) return;
    setIsLoading(true);
    try {
      await axios.post(`${API}/gallery`, { url: newImageUrl, alt: newImageAlt || "Baila Dembow Event" });
      toast.success("Image added successfully!");
      setNewImageUrl("");
      setNewImageAlt("");
      fetchGallery();
    } catch (error) {
      toast.error("Failed to add image");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (!window.confirm("Are you sure you want to delete this image?")) return;
    try {
      await axios.delete(`${API}/gallery/${imageId}`);
      toast.success("Image deleted!");
      fetchGallery();
    } catch (error) {
      toast.error("Failed to delete image");
    }
  };

  return (
    <>
      <div className="bg-white/5 rounded-2xl p-6 mb-8">
        <h2 className="font-display text-xl mb-4 text-white">Add New Image</h2>
        <form onSubmit={handleAddImage} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Image URL *</label>
            <input
              type="url"
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="input-styled w-full"
              required
              data-testid="admin-image-url"
            />
            <p className="text-xs text-gray-500 mt-1">Upload images to Google Drive, Imgur, or any image hosting service and paste the direct URL here</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Alt Text (optional)</label>
            <input
              type="text"
              value={newImageAlt}
              onChange={(e) => setNewImageAlt(e.target.value)}
              placeholder="Describe the image"
              className="input-styled w-full"
              data-testid="admin-image-alt"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="bg-[#FF0080] text-white font-bold py-3 px-6 rounded-full hover:bg-[#FF3B30] transition-colors duration-300"
            data-testid="admin-add-image-btn"
          >
            {isLoading ? "Adding..." : "Add Image"}
          </button>
        </form>
      </div>

      <div>
        <h2 className="font-display text-xl mb-4 text-white">Current Gallery ({galleryImages.length} images)</h2>
        {galleryImages.length === 0 ? (
          <p className="text-gray-400">No images in gallery yet. Add some above!</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {galleryImages.map((image, index) => (
              <div key={image.id} className="relative group">
                <div className="aspect-video rounded-xl overflow-hidden bg-gray-100">
                  <img src={image.url} alt={image.alt} className="w-full h-full object-cover" onError={(e) => { e.target.src = 'https://via.placeholder.com/400x300?text=Image+Error'; }} />
                </div>
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                  <button onClick={() => handleDeleteImage(image.id)} className="bg-red-500 text-white px-4 py-2 rounded-full text-sm font-bold hover:bg-red-600" data-testid={`admin-delete-${index}`}>Delete</button>
                </div>
                <p className="text-xs text-gray-500 mt-1 truncate">{image.alt}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

const DiscountCodesPanel = () => {
  const [stats, setStats] = useState(null);
  const [codes, setCodes] = useState([]);
  const [filter, setFilter] = useState('all');
  const [bulkCodes, setBulkCodes] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchCodes();
  }, [filter]);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/admin/discount-codes/stats`);
      setStats(response.data);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  const fetchCodes = async () => {
    setIsLoading(true);
    try {
      const statusParam = filter === 'all' ? '' : `?status=${filter}`;
      const response = await axios.get(`${API}/admin/discount-codes${statusParam}`);
      setCodes(response.data);
    } catch (error) {
      console.error("Failed to fetch codes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkUpload = async (e) => {
    e.preventDefault();
    if (!bulkCodes.trim()) return;
    setIsUploading(true);
    try {
      const codeList = bulkCodes.split(/[\n,;]+/).map(c => c.trim()).filter(Boolean);
      const response = await axios.post(`${API}/admin/discount-codes/upload`, { codes: codeList });
      toast.success(response.data.message);
      setBulkCodes('');
      fetchStats();
      fetchCodes();
    } catch (error) {
      toast.error("Failed to upload codes");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div data-testid="discount-codes-panel">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-3 gap-4 mb-8" data-testid="discount-stats">
          <div className="bg-white/5 rounded-2xl p-5 text-center">
            <p className="text-3xl font-bold text-white" data-testid="stats-total">{stats.total}</p>
            <p className="text-sm text-gray-400 mt-1">Total Codes</p>
          </div>
          <div className="bg-green-500/10 rounded-2xl p-5 text-center">
            <p className="text-3xl font-bold text-green-400" data-testid="stats-unused">{stats.unused}</p>
            <p className="text-sm text-gray-400 mt-1">Available</p>
          </div>
          <div className="bg-orange-500/10 rounded-2xl p-5 text-center">
            <p className="text-3xl font-bold text-orange-400" data-testid="stats-used">{stats.used}</p>
            <p className="text-sm text-gray-400 mt-1">Assigned</p>
          </div>
        </div>
      )}

      {/* Bulk Upload */}
      <div className="bg-white/5 rounded-2xl p-6 mb-8">
        <h2 className="font-display text-xl mb-4 text-white">Upload Discount Codes</h2>
        <form onSubmit={handleBulkUpload} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Paste codes (one per line, comma, or semicolon separated)</label>
            <textarea
              value={bulkCodes}
              onChange={(e) => setBulkCodes(e.target.value)}
              placeholder="CODE1&#10;CODE2&#10;CODE3"
              className="input-styled w-full h-32 resize-none font-mono text-sm"
              data-testid="bulk-codes-input"
            />
          </div>
          <button
            type="submit"
            disabled={isUploading}
            className="bg-[#FF0080] text-white font-bold py-3 px-6 rounded-full hover:bg-[#FF3B30] transition-colors duration-300"
            data-testid="bulk-upload-btn"
          >
            {isUploading ? "Uploading..." : "Upload Codes"}
          </button>
        </form>
      </div>

      {/* Codes List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl text-white">Discount Codes</h2>
          <div className="flex gap-1 bg-white/5 rounded-lg p-1">
            {['all', 'unused', 'used'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-all ${
                  filter === f ? 'bg-white/10 text-white shadow-sm' : 'text-gray-400 hover:text-white'
                }`}
                data-testid={`filter-${f}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <p className="text-gray-400 text-center py-8">Loading...</p>
        ) : codes.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No codes found</p>
        ) : (
          <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white/5 border-b border-white/10">
                  <th className="text-left px-4 py-3 font-semibold text-gray-300">Code</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-300">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-300 hidden md:table-cell">Assigned To</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-300 hidden md:table-cell">Assigned At</th>
                </tr>
              </thead>
              <tbody>
                {codes.slice(0, 50).map((code) => (
                  <tr key={code.id} className="border-b border-white/5 last:border-0 hover:bg-white/5">
                    <td className="px-4 py-3 font-mono font-bold text-white" data-testid={`code-${code.code}`}>{code.code}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                        code.is_used ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {code.is_used ? 'Used' : 'Available'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 hidden md:table-cell">{code.assigned_email || '-'}</td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell text-xs">
                      {code.assigned_at ? new Date(code.assigned_at).toLocaleString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {codes.length > 50 && (
              <div className="px-4 py-3 bg-white/5 text-sm text-gray-400 text-center">
                Showing 50 of {codes.length} codes
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export const AdminPage = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [activeTab, setActiveTab] = useState('gallery');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/admin/verify?password=${password}`);
      setIsAuthenticated(true);
      toast.success("Welcome to Admin Panel!");
    } catch (error) {
      toast.error("Invalid password");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] pt-24 flex items-center justify-center">
        <div className="max-w-md w-full p-8">
          <h1 className="font-display text-3xl mb-8 text-center text-white">
            ADMIN <span className="gradient-text">LOGIN</span>
          </h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              className="input-styled w-full"
              required
              data-testid="admin-password"
            />
            <button
              type="submit"
              className="w-full bg-[#FF0080] text-white font-bold py-4 px-8 rounded-full text-lg hover:bg-[#FF3B30] transition-colors duration-300"
              data-testid="admin-login-btn"
            >
              Login
            </button>
          </form>
          <div className="text-center mt-6">
            <a href="#/" className="text-[#FF0080] hover:underline">Back to Homepage</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] pt-24">
      <div className="container-custom py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display text-3xl text-white">
            ADMIN <span className="gradient-text">PANEL</span>
          </h1>
          <button
            onClick={() => setIsAuthenticated(false)}
            className="text-gray-400 hover:text-[#FF0080]"
            data-testid="admin-logout"
          >
            Logout
          </button>
        </div>

        <AdminTabs activeTab={activeTab} setActiveTab={setActiveTab} />

        {activeTab === 'gallery' && <GalleryPanel />}
        {activeTab === 'discount-codes' && <DiscountCodesPanel />}

        <div className="text-center mt-12">
          <a href="#/" className="inline-flex items-center gap-2 text-[#FF0080] font-semibold hover:underline">
            Back to Homepage
          </a>
        </div>
      </div>
    </div>
  );
};
