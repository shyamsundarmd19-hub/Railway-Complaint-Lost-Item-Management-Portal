import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { lostItemsAPI, documentsAPI } from '../api/client';
import { 
  PackageSearch, 
  UploadCloud, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Train, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

export const ReportLostItem = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    item_name: '',
    train_number: '',
    coach_number: '',
    seat_number: '',
    description: '',
    photo_url: '',
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 15 * 1024 * 1024) {
        setError('Photo size exceeds 15MB limit.');
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleRemovePhoto = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setFormData((prev) => ({ ...prev, photo_url: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      let finalPhotoKey = formData.photo_url;

      if (selectedFile) {
        setUploadingImage(true);
        const presignedData = await documentsAPI.getPresignedUrl(
          selectedFile.name,
          selectedFile.type || 'image/jpeg',
          'lost-items'
        );

        await documentsAPI.uploadToS3(
          presignedData.upload_url,
          selectedFile,
          selectedFile.type || 'image/jpeg'
        );

        finalPhotoKey = presignedData.final_url;
      }

      await lostItemsAPI.create({
        item_name: formData.item_name,
        train_number: formData.train_number,
        coach_number: formData.coach_number || null,
        seat_number: formData.seat_number || null,
        description: formData.description,
        photo_url: finalPhotoKey || null,
      });

      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to submit lost item report.');
    } finally {
      setSubmitting(false);
      setUploadingImage(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      
      {/* Title Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Station & On-Board Lost Property Vault</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          Report Lost Property
        </h1>
        <p className="text-xs sm:text-sm text-gray-600 max-w-lg mx-auto">
          Misplaced your belongings on a train or station platform? Log the details below to cross-match with railway custody inventory.
        </p>
      </div>

      {/* Main Form Card */}
      <div className="bg-white border border-emerald-100 rounded-3xl shadow-sm p-6 sm:p-8 space-y-6">
        
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Item Name */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Item Name & Type
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Navy Blue Wildcraft Backpack, iPhone 14 Pro, Black Leather Wallet"
              value={formData.item_name}
              onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-white border border-emerald-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-smooth placeholder:text-gray-400"
            />
          </div>

          {/* Train Number */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Train Number
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-600">
                <Train className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                placeholder="e.g. 12002, 12951, 22436"
                value={formData.train_number}
                onChange={(e) => setFormData({ ...formData, train_number: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-emerald-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-smooth placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Coach & Seat */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Coach Number (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. B2, S4, A1"
                value={formData.coach_number}
                onChange={(e) => setFormData({ ...formData, coach_number: e.target.value.toUpperCase() })}
                className="w-full px-3.5 py-2.5 bg-white border border-emerald-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-smooth placeholder:text-gray-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Berth / Seat Number (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. 34, 45, Overhead Rack"
                value={formData.seat_number}
                onChange={(e) => setFormData({ ...formData, seat_number: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white border border-emerald-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-smooth placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Distinctive Features & Identifying Marks
            </label>
            <textarea
              required
              rows={4}
              placeholder="Describe brand labels, contents, color, stickers, keychains, or any unique distinguishing characteristics..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-3.5 bg-white border border-emerald-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-smooth placeholder:text-gray-400"
            />
          </div>

          {/* Photo Attachment */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Item Photo or Purchase Bill (Optional)
            </label>

            {previewUrl ? (
              <div className="relative rounded-2xl border border-emerald-200 p-2 bg-emerald-50/30 overflow-hidden">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full max-h-60 object-cover rounded-xl"
                />
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="absolute top-4 right-4 p-2 bg-white/90 hover:bg-rose-50 text-rose-600 rounded-full shadow-md transition-smooth"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="border-2 border-dashed border-emerald-200 hover:border-emerald-400 bg-emerald-50/20 hover:bg-emerald-50/50 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-smooth">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 mb-3">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <span className="text-sm font-bold text-gray-800">
                  Click or drag photo here
                </span>
                <span className="text-xs text-gray-500 mt-1">
                  Helps station staff identify and verify ownership
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting || uploadingImage}
              className="w-full py-3.5 px-4 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-200 flex items-center justify-center gap-2 transition-smooth disabled:opacity-50"
            >
              {submitting || uploadingImage ? (
                <span>Registering Lost Item in Vault...</span>
              ) : (
                <>
                  <span>File Lost Property Report</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

        </form>
      </div>

    </div>
  );
};

export default ReportLostItem;
