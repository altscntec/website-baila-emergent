import { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { API } from '../../utils/constants';

export const AdminPage = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [galleryImages, setGalleryImages] = useState([]);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newImageAlt, setNewImageAlt] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/admin/verify?password=${password}`);
      setIsAuthenticated(true);
      fetchGallery();
      toast.success("Welcome to Admin Panel!");
    } catch (error) {
      toast.error("Invalid password");
    }
  };

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
      await axios.post(`${API}/gallery`, {
        url: newImageUrl,
        alt: newImageAlt || "Baila Dembow Event"
      });
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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white pt-24 flex items-center justify-center">
        <div className="max-w-md w-full p-8">
          <h1 className="font-display text-3xl mb-8 text-center">
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
            <a href="#/" className="text-[#FF0080] hover:underline">← Back to Homepage</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pt-24">
      <div className="container-custom py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display text-3xl">
            GALLERY <span className="gradient-text">ADMIN</span>
          </h1>
          <button
            onClick={() => setIsAuthenticated(false)}
            className="text-gray-500 hover:text-[#FF0080]"
          >
            Logout
          </button>
        </div>

        <div className="bg-gray-50 rounded-2xl p-6 mb-8">
          <h2 className="font-display text-xl mb-4">Add New Image</h2>
          <form onSubmit={handleAddImage} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Image URL *</label>
              <input
                type="url"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="input-styled w-full"
                required
                data-testid="admin-image-url"
              />
              <p className="text-xs text-gray-500 mt-1">
                Tip: Upload images to Google Drive, Imgur, or any image hosting service and paste the direct URL here
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Alt Text (optional)</label>
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
          <h2 className="font-display text-xl mb-4">Current Gallery ({galleryImages.length} images)</h2>
          {galleryImages.length === 0 ? (
            <p className="text-gray-500">No images in gallery yet. Add some above!</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {galleryImages.map((image, index) => (
                <div key={image.id} className="relative group">
                  <div className="aspect-video rounded-xl overflow-hidden bg-gray-100">
                    <img
                      src={image.url}
                      alt={image.alt}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.src = 'https://via.placeholder.com/400x300?text=Image+Error'; }}
                    />
                  </div>
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                    <button
                      onClick={() => handleDeleteImage(image.id)}
                      className="bg-red-500 text-white px-4 py-2 rounded-full text-sm font-bold hover:bg-red-600"
                      data-testid={`admin-delete-${index}`}
                    >
                      Delete
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 truncate">{image.alt}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="text-center mt-12">
          <a href="#/" className="inline-flex items-center gap-2 text-[#FF0080] font-semibold hover:underline">
            ← Back to Homepage
          </a>
        </div>
      </div>
    </div>
  );
};
