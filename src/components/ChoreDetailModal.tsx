import { useState } from 'react';
import type { ChoreEntry, User, Attachment, Strike } from '../types';
import { formatDate, fileToBase64, compressImage, generateId, isDateActionable, getAssignedUser } from '../utils';
import { CHORE_LABELS } from '../types';
import { X, CheckCircle, Clock, Undo2, Check, AlertTriangle, Paperclip, Send, Video } from 'lucide-react';

interface ChoreDetailModalProps {
  chore: ChoreEntry;
  strikes: Strike[];
  currentUser: User;
  onClose: () => void;
  onAddComment: (text: string, attachments: Attachment[]) => void;
  onToggle?: () => void;
  onStrike?: () => void;
}

export function ChoreDetailModal({ 
  chore,
  strikes,
  currentUser, 
  onClose, 
  onAddComment,
  onToggle,
  onStrike,
}: ChoreDetailModalProps) {
  const [commentText, setCommentText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  
  // Calculate assignedTo from date and choreType (not stored)
  const assignedTo = getAssignedUser(chore.choreType, chore.date);
  
  const isOwnChore = assignedTo === currentUser;
  const isActionable = isDateActionable(chore.date);
  const isTempEntry = chore.id.startsWith('temp-');
  
  // Determine if in current month for commenting
  const choreDate = new Date(chore.date);
  const today = new Date();
  const isCurrentMonth = choreDate.getFullYear() === today.getFullYear() && 
                         choreDate.getMonth() === today.getMonth();
  
  const canToggle = isOwnChore && isActionable;
  const choreStrikes = strikes.filter(s => s.choreId === chore.id);
  const canGiveStrike = chore.completed && !isOwnChore && !isTempEntry && choreStrikes.length === 0;
  const canAddComment = isCurrentMonth; // Can comment on any chore in current month
  
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
    if (!commentText.trim() && attachments.length === 0) return;
    
    onAddComment(commentText.trim(), attachments);
    setCommentText('');
    setAttachments([]);
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[90vh] sm:max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-4 border-b bg-gray-50 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-800 text-base sm:text-base">{CHORE_LABELS[chore.choreType]}</h3>
            <p className="text-sm sm:text-sm text-gray-500">{formatDate(chore.date)}</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 sm:w-10 sm:h-10 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center text-gray-600 transition-all"
          >
            <X size={20} className="sm:w-5 sm:h-5" />
          </button>
        </div>
        
        {/* Status & Actions */}
        <div className="p-5 sm:p-4 border-b">
          <div className="flex flex-wrap items-center gap-2 sm:gap-2 mb-4">
            <span className={`px-3 sm:px-3 py-1.5 rounded-full text-sm sm:text-sm font-medium flex items-center gap-1.5 ${
              chore.completed 
                ? 'bg-green-100 text-green-700' 
                : 'bg-yellow-100 text-yellow-700'
            }`}>
              {chore.completed ? <><CheckCircle size={16} className="sm:w-4 sm:h-4" /> Completed</> : <><Clock size={16} className="sm:w-4 sm:h-4" /> Pending</>}
            </span>
            {assignedTo && (
              <span className={`px-3 sm:px-3 py-1.5 rounded-full text-sm sm:text-sm font-medium ${
                assignedTo === 'Aleem' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-amber-100 text-amber-700'
              }`}>
                Assigned to {assignedTo}
              </span>
            )}
          </div>
          
          {chore.completed && chore.completedBy && (
            <p className="text-xs sm:text-sm text-gray-500 mb-3">
              Completed by {chore.completedBy} {chore.completedAt && `at ${new Date(chore.completedAt).toLocaleString()}`}
            </p>
          )}
          
          {isOwnChore && !isActionable && !chore.completed && (
            <p className="text-xs sm:text-sm text-orange-600 mb-3 bg-orange-50 p-2 rounded">
              This date is too far in the future. You can only mark chores up to 2 days ahead.
            </p>
          )}
          
          {isTempEntry && isCurrentMonth && (
            <p className="text-xs sm:text-sm text-blue-600 mb-3 bg-blue-50 p-2 rounded">
              This chore hasn't been marked yet. You can add comments or reminders.
            </p>
          )}
          
          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            {canToggle && onToggle && (
              <button
                onClick={onToggle}
                className={`px-4 sm:px-4 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 sm:gap-2 text-sm sm:text-sm ${
                  chore.completed
                    ? 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    : 'bg-green-500 hover:bg-green-600 text-white'
                }`}
              >
                {chore.completed ? <><Undo2 size={16} className="sm:w-[18px] sm:h-[18px]" /> Undo Complete</> : <><Check size={16} className="sm:w-[18px] sm:h-[18px]" /> Mark Complete</>}
              </button>
            )}
            
            {canGiveStrike && onStrike && (
              <button
                onClick={onStrike}
                className="px-4 sm:px-4 py-2.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium transition-all flex items-center gap-2 sm:gap-2 text-sm sm:text-sm"
              >
                <AlertTriangle size={18} className="sm:w-[18px] sm:h-[18px]" /> Give Strike
              </button>
            )}
          </div>
        </div>
        
        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto">
          {/* Strikes Section */}
          {!isTempEntry && choreStrikes.length > 0 && (
            <div className="p-5 sm:p-4 bg-red-50 border-b">
              <h4 className="font-medium text-red-700 mb-4 flex items-center gap-2 text-base sm:text-base">
                <AlertTriangle size={18} className="sm:w-[18px] sm:h-[18px]" /> Strikes ({choreStrikes.length})
              </h4>
              <div className="space-y-3 sm:space-y-3">
                {choreStrikes.map(strike => (
                  <div key={strike.id} className="bg-white p-2 sm:p-3 rounded-lg border border-red-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-medium text-gray-700">
                          Given by: <span className="text-red-600">{strike.givenBy}</span>
                        </span>
                        <span className="text-[10px] sm:text-xs text-gray-400">
                          {new Date(strike.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-700 mb-2"><strong>Reason:</strong> {strike.reason}</p>
                    {strike.attachments.length > 0 && (
                      <div>
                        <p className="text-[10px] sm:text-xs text-gray-500 mb-2">Evidence:</p>
                        <div className="flex flex-wrap gap-2">
                          {strike.attachments.map(att => (
                            <div key={att.id} className="relative">
                              {att.type === 'image' ? (
                                <img 
                                  src={att.url} 
                                  alt={att.name}
                                  className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg cursor-pointer hover:opacity-90 hover:ring-2 hover:ring-blue-400 transition-all border border-gray-300"
                                  onClick={() => setViewingImage(att.url)}
                                />
                              ) : (
                                <video 
                                  src={att.url}
                                  className="w-20 h-20 object-cover rounded-lg border border-gray-300"
                                  controls
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Comments */}
          <div className="p-5 sm:p-4">
            <h4 className="font-medium text-gray-700 mb-4 text-base sm:text-base">Comments ({chore.comments.length})</h4>
          
            {chore.comments.length === 0 ? (
              <p className="text-gray-400 text-center py-8 sm:py-8 text-sm sm:text-sm">No comments yet</p>
            ) : (
              <div className="space-y-3 sm:space-y-3">
                {chore.comments.map(comment => (
                  <div 
                    key={comment.id} 
                    className={`p-3 sm:p-3 rounded-lg text-sm sm:text-sm ${
                      comment.userId === currentUser ? 'bg-blue-50 ml-2 sm:ml-4' : 'bg-gray-100 mr-2 sm:mr-4'
                    }`}
                  >
                    <div className="flex items-center gap-2 sm:gap-2 mb-1.5">
                      <span className="font-medium text-sm sm:text-sm">{comment.userId}</span>
                      <span className="text-xs sm:text-xs text-gray-400">
                        {new Date(comment.createdAt).toLocaleString()}
                      </span>
                    </div>
                    {comment.text && <p className="text-gray-700 text-sm sm:text-sm leading-relaxed">{comment.text}</p>}
                    
                    {comment.attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2 sm:gap-2 mt-3">
                        {comment.attachments.map(att => (
                          <div key={att.id} className="relative">
                            {att.type === 'image' ? (
                              <img 
                                src={att.url} 
                                alt={att.name}
                                className="w-24 h-24 sm:w-20 sm:h-20 object-cover rounded-lg cursor-pointer hover:opacity-90 hover:ring-2 hover:ring-blue-400 transition-all"
                                onClick={() => setViewingImage(att.url)}
                              />
                            ) : (
                              <video 
                                src={att.url}
                                className="w-20 h-20 object-cover rounded-lg"
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
        
        {/* Add comment */}
        <div className="p-5 sm:p-4 border-t bg-gray-50">
          {canAddComment ? (
            <>
              {/* Attachments preview */}
              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 sm:gap-2 mb-3 sm:mb-3">
                  {attachments.map(att => (
                    <div key={att.id} className="relative">
                      {att.type === 'image' ? (
                        <img src={att.url} alt={att.name} className="w-16 h-16 sm:w-16 sm:h-16 object-cover rounded-lg" />
                      ) : (
                        <div className="w-16 h-16 sm:w-16 sm:h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                          <Video size={22} className="sm:w-6 sm:h-6" />
                        </div>
                      )}
                      <button
                        onClick={() => handleRemoveAttachment(att.id)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 sm:w-5 sm:h-5 bg-red-500 text-white rounded-full text-xs sm:text-xs flex items-center justify-center"
                      >
                        <X size={12} className="sm:w-3 sm:h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex gap-2 sm:gap-2">
                <label className="w-11 h-11 sm:w-10 sm:h-10 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center cursor-pointer transition-all flex-shrink-0">
                  <Paperclip size={20} className="sm:w-5 sm:h-5" />
                  <input
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={isUploading}
                  />
                </label>
                
                <input
                  type="text"
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 px-4 sm:px-4 py-2.5 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                />
                
                <button
                  onClick={handleSubmit}
                  disabled={!commentText.trim() && attachments.length === 0}
                  className="w-11 h-11 sm:w-10 sm:h-10 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-full flex items-center justify-center transition-all flex-shrink-0"
                >
                  <Send size={18} className="sm:w-[18px] sm:h-[18px]" />
                </button>
              </div>
            </>
          ) : (
            <p className="text-xs sm:text-sm text-gray-500 text-center py-2">
              Comments are only available for chores in the current month
            </p>
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
