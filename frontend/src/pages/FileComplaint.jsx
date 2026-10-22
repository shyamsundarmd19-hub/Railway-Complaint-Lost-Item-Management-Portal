import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { trainsAPI, complaintsAPI, documentsAPI } from '../api/client';
import { 
  Train, 
  FilePlus, 
  UploadCloud, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  ShieldAlert, 
  Sparkles,
  ArrowRight
} from 'lucide-react';

export const FileComplaint = () => {
  const navigate = useNavigate();

  const [trains, setTrains] = useState([]);
  const [loadingTrains, setLoadingTrains] = useState(true);

  const [formData, setFormData] = useState({
    train_number: '',
    coach_number: '',
    seat_number: '',
    category: 'cleanliness',
    priority: 'Medium',
    description: '',
    photo_url: '',
  });

  // Photo Upload State
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadTrains = async () => {
      try {
        const list = await trainsAPI.list();
        setTrains(list || []);
        if (list && list.length > 0) {
          setFormData((prev) => ({ ...prev, train_number: list[0].train_number }));
        }
      } catch (err) {
        console.warn('Could not load train routes:', err);
      } finally {
        setLoadingTrains(false);
      }
    };
    loadTrains();
  }, []);

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

      // 1. If user selected a new photo, request AWS S3 presigned URL & upload
      if (selectedFile) {
        setUploadingImage(true);
        const presignedData = await documentsAPI.getPresignedUrl(
          selectedFile.name,
          selectedFile.type || 'image/jpeg',
          'complaints'
        );

        // Upload to S3 directly
        await documentsAPI.uploadToS3(
          presignedData.upload_url,
          selectedFile,
          selectedFile.type || 'image/jpeg'
        );

        finalPhotoKey = presignedData.final_url;
      }

      // 2. Submit Complaint payload to backend
      await complaintsAPI.create({
        train_number: formData.train_number,
        coach_number: formData.coach_number,
        seat_number: formData.seat_number,
        category: formData.category,
        priority: formData.priority,
        description: formData.description,
        photo_url: finalPhotoKey || null,
      });

      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to submit grievance. Please verify details.');
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
          <ShieldAlert className="w-3.5 h-3.5 text-emerald-600" />
          <span>Indian Railways Redressal Cell</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          File an Onboard Railway Grievance
        </h1>
        <p className="text-xs sm:text-sm text-gray-600 max-w-lg mx-auto">
          Report issues regarding cleanliness, catering, electrical fittings, or passenger safety. All tickets are assigned directly to on-duty division controllers.
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
          
          {/* Train Selection */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
              Train Number & Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-600">
                <Train className="w-4 h-4" />
              </div>
              <select
                required
                value={formData.train_number}
                onChange={(e) => setFormData({ ...formData, train_number: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-emerald-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-smooth"
              >
                {trains.map((t) => (
                  <option key={t.id} value={t.train_number}>
                    {t.train_number} &mdash; {t.train_name} ({t.source} &rarr; {t.destination})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Coach & Seat */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Coach Number
              </label>
              <input
                type="text"
                required
                placeholder="e.g. B4, S2, A1, C1"
                value={formData.coach_number}
                onChange={(e) => setFormData({ ...formData, coach_number: e.target.value.toUpperCase() })}
                className="w-full px-3.5 py-2.5 bg-white border border-emerald-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-smooth placeholder:text-gray-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Berth / Seat Number
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 23, 45, 62"
                value={formData.seat_number}
                onChange={(e) => setFormData({ ...formData, seat_number: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white border border-emerald-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-smooth placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Category & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Grievance Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white border border-emerald-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-smooth"
              >
                <option value="cleanliness">Coach & Toilet Cleanliness</option>
                <option value="pantry">Pantry & Catering Quality</option>
                <option value="electrical">Electrical (AC, Fan, Charging Socket)</option>
                <option value="security">Security & RPF Assistance</option>
                <option value="other">Other Grievance</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Priority Level
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white border border-emerald-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-smooth"
              >
                <option value="Low">Low (Informational)</option>
                <option value="Medium">Medium (Standard)</option>
                <option value="High">High (Immediate inspection)</option>
                <option value="Urgent">Urgent (Medical / Safety Emergency)</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Detailed Description
            </label>
            <textarea
              required
              rows={4}
              placeholder="Provide exact details of the issue so on-board railway staff can resolve it swiftly..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-3.5 bg-white border border-emerald-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-smooth placeholder:text-gray-400"
            />
          </div>

          {/* Photo Drag & Drop / Presigned Uploader */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Upload Photo Evidence (Encrypted to AWS S3)
            </label>

            {previewUrl ? (
              <div className="relative rounded-2xl border border-emerald-200 p-2 bg-emerald-50/30 overflow-hidden group">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full max-h-60 object-cover rounded-xl"
                />
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="absolute top-4 right-4 p-2 bg-white/90 hover:bg-rose-50 text-rose-600 rounded-full shadow-md transition-smooth"
                  title="Remove photo"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="p-2 text-center text-xs text-emerald-800 font-semibold">
                  Photo ready for secure direct AWS S3 Vault upload
                </div>
              </div>
            ) : (
              <label className="border-2 border-dashed border-emerald-200 hover:border-emerald-400 bg-emerald-50/20 hover:bg-emerald-50/50 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-smooth group">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 mb-3 group-hover:scale-110 transition-smooth">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <span className="text-sm font-bold text-gray-800">
                  Click to select or drag photo here
                </span>
                <span className="text-xs text-gray-500 mt-1">
                  JPG, PNG, or WEBP up to 15MB &bull; Stored with SSE-S3 AES256
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

          {/* Submit Action */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting || uploadingImage}
              className="w-full py-3.5 px-4 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-200 flex items-center justify-center gap-2 transition-smooth disabled:opacity-50"
            >
              {submitting || uploadingImage ? (
                <span>Registering Ticket & Uploading to S3...</span>
              ) : (
                <>
                  <span>Submit Railway Grievance</span>
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

export default FileComplaint;
