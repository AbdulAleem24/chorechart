import { useState } from 'react';
import type { User, Attachment, Strike } from '../types';
import { fileToBase64, compressImage, generateId, formatDate } from '../utils';
import { AlertTriangle, Paperclip, Video, X, PartyPopper } from 'lucide-react';

interface StrikeModalProps {
  targetUser: User;
  onSubmit: (reason: string, attachments: Attachment[]) => void;
  onClose: () => void;
}

export function StrikeModal({ targetUser, onSubmit, onClose }: StrikeModalProps) {
  const [reason, setReason] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    setIsUploading(true);
    
    try {
      const newAttachments: Attachment[] = [];
      
      for (const file of Array.from(files)) {
        // Compress images before converting to base64
        const processedFile = await compressImage(file);
        const url = await fileToBase64(processedFile);
        const type = file.type.startsWith('video/') ? 'video' : 'image';
        
        newAttachments.push({
          id: generateId(),
          type,
          url,
          name: file.name,
        });
      }
      
      setAttachments(prev => [...prev, ...newAttachments]);
    } catch (err) {
      console.error('Failed to upload file:', err);
      alert('Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleRemoveAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };
  
  const handleSubmit = () => {
    if (!reason.trim()) return;
    onSubmit(reason.trim(), attachments);
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50" onClick={onClose}>
      <div 
        className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl p-6 sm:p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-4 sm:mb-4">
          <div className="mb-3 flex justify-center">
            <div className="w-16 h-16 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle size={36} className="text-red-500 sm:w-10 sm:h-10" />
            </div>
          </div>
          <h2 className="text-xl sm:text-xl font-bold text-gray-800">Give Strike to {targetUser}</h2>
          <p className="text-gray-500 text-sm sm:text-sm">This will be added to their strike tally</p>
        </div>
        
        <div className="space-y-4 sm:space-y-4">
          <div>
            <label className="block text-sm sm:text-sm font-medium text-gray-700 mb-2">
              Reason for strike *
            </label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Explain why you're giving this strike..."
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none text-base"
              rows={3}
            />
          </div>
          
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Photo/Video Evidence (optional)
            </label>
            
            {/* Attachments preview */}
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-2">
                {attachments.map(att => (
                  <div key={att.id} className="relative">
                    {att.type === 'image' ? (
                      <img 
                        src={att.url} 
                        alt={att.name} 
                        className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded-lg cursor-pointer hover:opacity-90 hover:ring-2 hover:ring-blue-400 transition-all"
                        onClick={() => setViewingImage(att.url)}
                      />
                    ) : (
                      <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                        <Video size={20} className="sm:w-6 sm:h-6" />
                      </div>
                    )}
                    <button
                      onClick={() => handleRemoveAttachment(att.id)}
                      className="absolute -top-1.5 -right-1.5 w-4 h-4 sm:w-5 sm:h-5 bg-red-500 text-white rounded-full text-[10px] sm:text-xs flex items-center justify-center"
                    >
                      <X size={10} className="sm:w-3 sm:h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <label className="flex items-center justify-center gap-2 sm:gap-2 p-3 sm:p-3 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 transition-all text-base">
              <Paperclip size={20} className="sm:w-5 sm:h-5" />
              <span>Add photos/videos</span>
              <input
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                disabled={isUploading}
              />
            </label>
          </div>
        </div>
        
        <div className="flex gap-3 sm:gap-3 mt-6 sm:mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-3 sm:py-3 px-4 sm:px-4 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-xl transition-all text-base sm:text-base"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!reason.trim()}
            className="flex-1 py-3 sm:py-3 px-4 sm:px-4 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 sm:gap-2 text-base sm:text-base"
          >
            <AlertTriangle size={18} className="sm:w-[18px] sm:h-[18px]" /> Give Strike
          </button>
        </div>
      </div>
      
      {/* Image Viewer Lightbox */}
      {viewingImage && (
        <div 
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60] p-4"
          onClick={() => setViewingImage(null)}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setViewingImage(null);
            }}
            className="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-all z-10"
          >
            <X size={24} />
          </button>
          <img 
            src={viewingImage} 
            alt="Enlarged view"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

interface StrikeHistoryModalProps {
  strikes: Strike[];
  onClose: () => void;
}

export function StrikeHistoryModal({ strikes, onClose }: StrikeHistoryModalProps) {
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 sm:p-4 border-b bg-gray-50 flex items-center justify-between">
          <h3 className="font-bold text-gray-800 flex items-center gap-2 sm:gap-2 text-base sm:text-base">
            <AlertTriangle size={20} className="sm:w-5 sm:h-5" /> Strike History
          </h3>
          <button
            onClick={onClose}
            className="w-10 h-10 sm:w-10 sm:h-10 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center text-gray-600 transition-all"
          >
            <X size={20} className="sm:w-5 sm:h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-5 sm:p-4">
          {strikes.length === 0 ? (
            <p className="text-gray-400 text-center py-8 sm:py-8 flex items-center justify-center gap-2 text-sm">
              No strikes this month! <PartyPopper size={20} className="sm:w-5 sm:h-5" />
            </p>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {strikes.map(strike => (
                <div 
                  key={strike.id} 
                  className="p-2.5 sm:p-3 rounded-lg bg-red-50 border border-red-200"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-red-800 text-xs sm:text-sm">
                      {strike.givenBy} → {strike.givenTo}
                    </span>
                    <span className="text-[10px] sm:text-xs text-gray-500">
                      {formatDate(strike.createdAt)}
                    </span>
                  </div>
                  <p className="text-gray-700 text-xs sm:text-sm">{strike.reason}</p>
                  
                  {strike.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2">
                      {strike.attachments.map(att => (
                        <div key={att.id}>
                          {att.type === 'image' ? (
                            <img 
                              src={att.url} 
                              alt={att.name}
                              className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg cursor-pointer hover:opacity-90 hover:ring-2 hover:ring-blue-400 transition-all"
                              onClick={() => setViewingImage(att.url)}
                            />
                          ) : (
                            <video 
                              src={att.url}
                              className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg"
                              controls
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Image Viewer Lightbox */}
      {viewingImage && (
        <div 
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60] p-4"
          onClick={() => setViewingImage(null)}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setViewingImage(null);
            }}
            className="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-all z-10"
          >
            <X size={24} />
          </button>
          <img 
            src={viewingImage} 
            alt="Enlarged view"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
