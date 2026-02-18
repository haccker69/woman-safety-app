import React, { useState, useEffect, useRef } from 'react';
import { chatAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Send, MessageCircle, X, Users, Loader, AlertCircle, Zap, Mic, MapPin, Square, Play, Pause, ExternalLink } from 'lucide-react';

// Quick suggestions based on role
const QUICK_SUGGESTIONS = {
  user: [
    { text: '🆘 Need help NOW!', urgent: true },
    { text: '👀 Being followed', urgent: true },
    { text: '📍 Location changed', urgent: false },
    { text: '✅ I\'m safe now', urgent: false },
    { text: '🚔 Send police immediately', urgent: true },
    { text: '⏳ Still waiting for help', urgent: false },
  ],
  police: [
    { text: '🚔 On my way', urgent: false },
    { text: '📍 Share your exact location', urgent: false },
    { text: '✅ Arrived at location', urgent: false },
    { text: '🔍 Searching the area', urgent: false },
    { text: '👮 Backup requested', urgent: true },
    { text: '✅ Situation resolved', urgent: false },
  ],
  admin: [
    { text: '📋 Monitoring situation', urgent: false },
    { text: '🚔 Police dispatched', urgent: false },
    { text: '📞 Please stay calm', urgent: false },
    { text: '✅ Help is on the way', urgent: false },
    { text: '📍 Confirm your location', urgent: false },
    { text: '⚠️ Additional units alerted', urgent: true },
  ],
};

const ChatRoom = ({ sosAlertId, onClose, isOpen }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [chatInfo, setChatInfo] = useState(null);
  const messagesEndRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const messagesRef = useRef(messages);
  
  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [sendingLocation, setSendingLocation] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const recordingDurationRef = useRef(0);
  const [playingAudioId, setPlayingAudioId] = useState(null);
  const audioRef = useRef(null);

  // Keep ref in sync with state
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && sosAlertId) {
      fetchMessages();
      fetchChatInfo();
      
      // Poll for new messages every 2 seconds
      pollIntervalRef.current = setInterval(() => {
        fetchNewMessages();
      }, 2000);

      return () => {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
        }
      };
    }
  }, [isOpen, sosAlertId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchChatInfo = async () => {
    try {
      const response = await chatAPI.getChatInfo(sosAlertId);
      setChatInfo(response?.data?.data);
    } catch (err) {
      console.error('Error fetching chat info:', err);
    }
  };

  const fetchMessages = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await chatAPI.getMessages(sosAlertId);
      setMessages(response?.data?.data || []);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError(err.response?.data?.message || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const fetchNewMessages = async () => {
    const currentMessages = messagesRef.current;
    if (currentMessages.length === 0) {
      // If no messages yet, fetch all
      try {
        const response = await chatAPI.getMessages(sosAlertId);
        const allMsgs = response?.data?.data || [];
        if (allMsgs.length > 0) {
          setMessages(allMsgs);
        }
      } catch (err) {
        console.error('Error fetching messages:', err);
      }
      return;
    }
    
    try {
      const lastMessage = currentMessages[currentMessages.length - 1];
      const response = await chatAPI.getMessages(sosAlertId, lastMessage.createdAt);
      const newMsgs = response?.data?.data || [];
      if (newMsgs.length > 0) {
        setMessages(prev => [...prev, ...newMsgs]);
      }
    } catch (err) {
      console.error('Error fetching new messages:', err);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const response = await chatAPI.sendMessage(sosAlertId, newMessage.trim());
      if (response?.data?.data) {
        setMessages(prev => [...prev, response.data.data]);
      }
      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err.response?.data?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleQuickSend = async (text) => {
    if (sending) return;
    
    setSending(true);
    try {
      const response = await chatAPI.sendMessage(sosAlertId, text);
      if (response?.data?.data) {
        setMessages(prev => [...prev, response.data.data]);
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err.response?.data?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  // Audio recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result;
          // Use ref for accurate duration
          await sendAudioMessage(base64Audio, recordingDurationRef.current);
        };
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      recordingDurationRef.current = 0;
      
      recordingTimerRef.current = setInterval(() => {
        recordingDurationRef.current += 1;
        setRecordingDuration(recordingDurationRef.current);
      }, 1000);
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Could not access microphone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    }
  };

  const sendAudioMessage = async (audioData, duration) => {
    setSending(true);
    try {
      const response = await chatAPI.sendAudioMessage(sosAlertId, audioData, duration);
      if (response?.data?.data) {
        setMessages(prev => [...prev, response.data.data]);
      }
    } catch (err) {
      console.error('Error sending audio:', err);
      setError('Failed to send audio message');
    } finally {
      setSending(false);
      setRecordingDuration(0);
      recordingDurationRef.current = 0;
    }
  };

  const playAudio = (messageId, audioData) => {
    if (playingAudioId === messageId) {
      // Stop playing
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setPlayingAudioId(null);
    } else {
      // Start playing
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audio = new Audio(audioData);
      audio.onended = () => setPlayingAudioId(null);
      audio.play();
      audioRef.current = audio;
      setPlayingAudioId(messageId);
    }
  };

  // Location sharing function
  const shareLocation = async () => {
    setSendingLocation(true);
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000
        });
      });

      const { latitude: lat, longitude: lng } = position.coords;
      
      // Try to get address using reverse geocoding
      let address = '';
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
        );
        const data = await response.json();
        address = data.display_name || '';
      } catch {
        address = '';
      }

      const response = await chatAPI.sendLocationMessage(sosAlertId, { lat, lng, address });
      if (response?.data?.data) {
        setMessages(prev => [...prev, response.data.data]);
      }
    } catch (err) {
      console.error('Error sharing location:', err);
      setError('Could not get location');
    } finally {
      setSendingLocation(false);
    }
  };

  const openInMaps = (lat, lng) => {
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getUserRole = () => {
    if (user?.role === 'admin') return 'admin';
    if (user?.role === 'police') return 'police';
    return 'user';
  };

  const quickSuggestions = QUICK_SUGGESTIONS[getUserRole()] || QUICK_SUGGESTIONS.user;

  const getRoleColor = (role) => {
    switch (role) {
      case 'user':
        return 'bg-red-100 text-red-800';
      case 'police':
        return 'bg-blue-100 text-blue-800';
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleBubbleColor = (role, isOwn) => {
    if (isOwn) {
      return 'bg-blue-600 text-white';
    }
    switch (role) {
      case 'user':
        return 'bg-red-50 text-gray-900 border border-red-100';
      case 'police':
        return 'bg-blue-50 text-gray-900 border border-blue-100';
      case 'admin':
        return 'bg-purple-50 text-gray-900 border border-purple-100';
      default:
        return 'bg-gray-100 text-gray-900';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg h-[85vh] sm:h-[600px] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Emergency Chat</h2>
              <p className="text-blue-100 text-xs">
                {chatInfo?.participants?.length || 0} participants
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Participants */}
        {chatInfo?.participants && (
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex items-center gap-2 overflow-x-auto">
            <Users className="w-4 h-4 text-gray-400 flex-shrink-0" />
            {chatInfo.participants.map((p, idx) => (
              <span
                key={idx}
                className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${getRoleColor(p.role)}`}
              >
                {p.name} ({p.role})
              </span>
            ))}
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <AlertCircle className="w-10 h-10 text-red-400 mb-2" />
              <p className="text-gray-600 text-sm">{error}</p>
              <button
                onClick={fetchMessages}
                className="mt-3 text-blue-600 text-sm font-medium hover:underline"
              >
                Try again
              </button>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <MessageCircle className="w-10 h-10 text-gray-300 mb-2" />
              <p className="text-gray-500 text-sm">No messages yet</p>
              <p className="text-gray-400 text-xs mt-1">Start the conversation</p>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isOwn = msg.sender === user?._id || msg.sender === user?.id;
              return (
                <div
                  key={msg._id || idx}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] ${isOwn ? 'order-1' : 'order-2'}`}>
                    {!isOwn && (
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getRoleColor(msg.senderRole)}`}>
                          {msg.senderName}
                        </span>
                      </div>
                    )}
                    <div
                      className={`px-4 py-2.5 rounded-2xl ${getRoleBubbleColor(msg.senderRole, isOwn)} ${
                        isOwn ? 'rounded-br-md' : 'rounded-bl-md'
                      }`}
                    >
                      {/* Text message */}
                      {(!msg.messageType || msg.messageType === 'text') && (
                        <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                      )}
                      
                      {/* Audio message */}
                      {msg.messageType === 'audio' && (
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => playAudio(msg._id, msg.audioData)}
                            className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              isOwn ? 'bg-white/20 hover:bg-white/30' : 'bg-gray-200 hover:bg-gray-300'
                            }`}
                          >
                            {playingAudioId === msg._id ? (
                              <Pause className={`w-4 h-4 ${isOwn ? 'text-white' : 'text-gray-700'}`} />
                            ) : (
                              <Play className={`w-4 h-4 ${isOwn ? 'text-white' : 'text-gray-700'}`} />
                            )}
                          </button>
                          <div className="flex flex-col">
                            <span className={`text-sm ${isOwn ? 'text-white' : 'text-gray-900'}`}>
                              🎤 Voice message
                            </span>
                            {msg.audioDuration > 0 && (
                              <span className={`text-xs ${isOwn ? 'text-white/70' : 'text-gray-500'}`}>
                                {formatDuration(msg.audioDuration)}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Location message */}
                      {msg.messageType === 'location' && msg.location && (
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <MapPin className={`w-4 h-4 ${isOwn ? 'text-white' : 'text-red-500'}`} />
                            <span className={`text-sm font-medium ${isOwn ? 'text-white' : 'text-gray-900'}`}>
                              📍 Location shared
                            </span>
                          </div>
                          {msg.location.address && (
                            <p className={`text-xs ${isOwn ? 'text-white/80' : 'text-gray-600'} line-clamp-2`}>
                              {msg.location.address}
                            </p>
                          )}
                          <button
                            onClick={() => openInMaps(msg.location.lat, msg.location.lng)}
                            className={`flex items-center gap-1 text-xs font-medium ${
                              isOwn ? 'text-white hover:text-white/80' : 'text-blue-600 hover:text-blue-700'
                            }`}
                          >
                            <ExternalLink className="w-3 h-3" />
                            Open in Maps
                          </button>
                        </div>
                      )}
                    </div>
                    <p className={`text-xs text-gray-400 mt-1 ${isOwn ? 'text-right' : 'text-left'}`}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestions */}
        <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-xs font-medium text-gray-500">Quick responses</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {quickSuggestions.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => handleQuickSend(suggestion.text)}
                disabled={sending}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                  suggestion.urgent
                    ? 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-200'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {suggestion.text}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-100 bg-white">
          {/* Recording indicator */}
          {isRecording && (
            <div className="flex items-center justify-center gap-3 mb-3 py-2 px-4 bg-red-50 rounded-lg border border-red-100">
              <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
              <span className="text-red-600 font-medium text-sm">Recording... {formatDuration(recordingDuration)}</span>
              <button
                onClick={stopRecording}
                className="ml-2 p-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-600"
              >
                <Square className="w-4 h-4" />
              </button>
            </div>
          )}
          
          <form onSubmit={handleSend} className="flex items-center gap-2">
            {/* Location button */}
            <button
              type="button"
              onClick={shareLocation}
              disabled={sending || sendingLocation || isRecording}
              className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-green-200"
              title="Share location"
            >
              {sendingLocation ? (
                <Loader className="w-5 h-5 animate-spin" />
              ) : (
                <MapPin className="w-5 h-5" />
              )}
            </button>
            
            {/* Audio button */}
            <button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              disabled={sending || sendingLocation}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors border ${
                isRecording
                  ? 'bg-red-500 text-white border-red-500 hover:bg-red-600'
                  : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              title={isRecording ? 'Stop recording' : 'Record voice message'}
            >
              {isRecording ? (
                <Square className="w-5 h-5" />
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </button>
            
            {/* Text input */}
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              disabled={sending || isRecording}
            />
            
            {/* Send button */}
            <button
              type="submit"
              disabled={!newMessage.trim() || sending || isRecording}
              className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {sending ? (
                <Loader className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatRoom;