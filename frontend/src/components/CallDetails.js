import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getCallDetails, getCallTranscript, getCorrectedTranscript, getCallRecording } from '../api';
import { supabase } from '../supabaseClient';

const CallDetails = ({ callId, darkMode }) => {
  const [details, setDetails] = useState(null);
  const [transcript, setTranscript] = useState(null);
  const [recordingUrl, setRecordingUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloadingTranscript, setDownloadingTranscript] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(null);

  // Cache to avoid excessive API calls
  const [lastFetchTime, setLastFetchTime] = useState({});
  const [hasCompletedTranscript, setHasCompletedTranscript] = useState(false);
  
  useEffect(() => {
    let intervalId;
    async function fetchCallData() {
      setError(null);
      try {
        // Only proceed if callId is defined
        if (!callId || callId === 'undefined') {
          setError('Invalid call ID');
          setLoading(false);
          return;
        }
        
        const now = Date.now();
        const lastDetailsTime = lastFetchTime.details || 0;
        const lastTranscriptTime = lastFetchTime.transcript || 0;
        const lastRecordingTime = lastFetchTime.recording || 0;
        
        // Intelligent fetching - Only fetch data that needs to be updated
        let detailsData = details;
        let recordingData = null;
        let needTranscriptFetch = false;
        
        // Always fetch details on first load or if it's been more than 5 seconds
        if (!details || now - lastDetailsTime > 5000) {
          detailsData = await getCallDetails(callId);
          setDetails(detailsData);
          setLastFetchTime(prev => ({ ...prev, details: now }));
          
          // If we have a newly completed call, fetch recording
          if (detailsData && (detailsData.status === 'success' || detailsData.status === 'completed')) {
            if (!recordingUrl && now - lastRecordingTime > 5000) {
              recordingData = await getCallRecording(callId);
              if (recordingData && (recordingData.status === 'success' || recordingData.recording_url)) {
                setRecordingUrl(recordingData.recording_url || recordingData.url);
                setLastFetchTime(prev => ({ ...prev, recording: now }));
              }
            }
            
            // If call is completed, we need transcript
            needTranscriptFetch = true;
          }
        }
        
        // Fetch transcript if not already fetched or if the call is still in progress
        if (!hasCompletedTranscript && 
            (needTranscriptFetch || !transcript || now - lastTranscriptTime > 3000)) {
          try {
            const transcriptData = await getCorrectedTranscript(callId);
            setLastFetchTime(prev => ({ ...prev, transcript: now }));
            
            if (transcriptData && transcriptData.status === "success" && transcriptData.aligned) {
              setTranscript(transcriptData.aligned);
              // If we have aligned transcript and call is complete, stop polling
              if (detailsData && (detailsData.status === 'success' || detailsData.status === 'completed')) {
                setHasCompletedTranscript(true);
              }
            } else if (transcriptData && transcriptData.status === "success" && transcriptData.transcript) {
              // Convert plain text transcript to a simple aligned format with a single speaker
              setTranscript([{ text: transcriptData.transcript, speaker: "Agent" }]);
              // If we have any transcript and call is complete, stop polling
              if (detailsData && (detailsData.status === 'success' || detailsData.status === 'completed')) {
                setHasCompletedTranscript(true);
              }
            } else if (transcriptData && transcriptData.status === "pending") {
              // Call is still in progress, keep polling
              console.log("Call still in progress, waiting for transcript...");
            }
          } catch (transcriptError) {
            console.error("Error fetching transcript:", transcriptError);
            // Keep the current transcript if there was an error fetching a new one
          }
        }
      } catch (err) {
        console.error('Error fetching call data:', err);
        setError('Failed to load call data. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchCallData();

    // Only set up refresh interval if needed (call is in progress or pending)
    // And use a smarter approach to reduce API calls
    if (details && (details.status === 'in-progress' || details.status === 'pending')) {
      // For in-progress calls, poll every 3 seconds
      intervalId = setInterval(fetchCallData, 3000);
      setRefreshInterval(intervalId);
    } else if (!details) {
      // For initial load when details aren't fetched yet, do one quick refresh after 2 seconds
      // then stop if the call is completed
      intervalId = setTimeout(() => {
        fetchCallData().then(() => {
          // After this first refresh, only continue polling if call is still in progress
          if (details && (details.status === 'in-progress' || details.status === 'pending')) {
            const newIntervalId = setInterval(fetchCallData, 3000);
            setRefreshInterval(newIntervalId);
          }
        });
      }, 2000);
      setRefreshInterval(intervalId);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [callId]);

  // Stop polling interval when component unmounts
  useEffect(() => {
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [refreshInterval]);

  const formatDateTime = (isoString) => {
    if (!isoString) return 'Unknown time';
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });
  };
  
  const downloadTranscript = async () => {
    if (!transcript) return;
    
    setDownloadingTranscript(true);
    try {
      // Format transcript for download
      let textContent = '';
      
      if (Array.isArray(transcript)) {
        transcript.forEach(item => {
          if (item.text) {
            textContent += `${item.speaker || 'Speaker'}: ${item.text}\n\n`;
          }
        });
      } else if (typeof transcript === 'string') {
        textContent = transcript;
      } else if (typeof transcript === 'object') {
        textContent = JSON.stringify(transcript, null, 2);
      }
      
      // Create and trigger download
      const element = document.createElement('a');
      const file = new Blob([textContent], {type: 'text/plain'});
      element.href = URL.createObjectURL(file);
      element.download = `transcript_${callId}.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } catch (err) {
      console.error('Error downloading transcript:', err);
    } finally {
      setDownloadingTranscript(false);
    }
  };

  return (
    <div>
      {loading && (
        <div style={{ 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px 0', 
          color: darkMode ? '#aaa' : '#666',
          fontSize: 14 
        }}>
          <svg 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            style={{ 
              marginRight: 8,
              animation: 'spin 1s linear infinite'
            }}
          >
            <style>
              {`
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              `}
            </style>
            <path 
              fill="currentColor" 
              d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z" 
            />
          </svg>
          Loading call details...
        </div>
      )}
      
      {error && (
        <div style={{ 
          color: '#f44336', 
          marginBottom: 16, 
          fontSize: 14,
          textAlign: 'center',
          padding: '8px'
        }}>
          {error}
        </div>
      )}
      
      {!loading && !error && (
        <div>
          {details && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                marginBottom: 8,
                fontSize: 14
              }}>
                <span style={{ color: darkMode ? '#9aa0b5' : '#666' }}>
                  {formatDateTime(details.created_at || details.timestamp)}
                </span>
                <span style={{ 
                  color: details.status === 'success' || details.status === 'completed' ? '#43a047' : '#ff9800',
                  fontWeight: 500
                }}>
                  {details.status === 'success' || details.status === 'completed' ? 'Completed' : 'In Progress'}
                </span>
              </div>
              
              {details.phone && (
                <div style={{ 
                  fontSize: 14, 
                  marginBottom: 16,
                  color: darkMode ? '#9aa0b5' : '#666',
                }}>
                  <div>To: +{details.phone || details.phone_number}</div>
                  <div>From: {details.from_number || '+19064981948'}</div>
                </div>
              )}
            </div>
          )}
          
          {/* Transcript Section */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ 
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 12
            }}>
              <h3 style={{ 
                margin: 0, 
                fontSize: 16,
                fontWeight: 500,
                color: darkMode ? '#eaebef' : '#333'
              }}>
                Transcript
              </h3>
              
              {transcript && (
                <button 
                  onClick={downloadTranscript}
                  disabled={downloadingTranscript}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 13,
                    color: darkMode ? '#9aa0b5' : '#555',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '4px 8px',
                    borderRadius: 4,
                    backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
                  }}
                >
                  {downloadingTranscript ? 'Downloading...' : 'Download'}
                  {!downloadingTranscript && (
                    <svg width="16" height="16" viewBox="0 0 24 24" style={{ marginLeft: 4 }}>
                      <path fill="currentColor" d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z" />
                    </svg>
                  )}
                </button>
              )}
            </div>
            
            {transcript ? (
              <div style={{ 
                backgroundColor: darkMode ? '#13141a' : '#f5f5f5',
                borderRadius: 8,
                padding: 12,
                fontSize: 14,
                maxHeight: '400px',
                overflowY: 'auto'
              }}>
                {Array.isArray(transcript) ? (
                  transcript.map((item, idx) => (
                    <div 
                      key={idx}
                      style={{ 
                        marginBottom: 16,
                        display: 'flex'
                      }}
                    >
                      <div style={{
                        minWidth: 50,
                        fontWeight: 500,
                        color: item.speaker === 'User' || item.speaker === 'user' ? 
                          (darkMode ? '#64b5f6' : '#2196f3') : 
                          (darkMode ? '#81c784' : '#43a047')
                      }}>
                        {item.speaker === 'User' || item.speaker === 'user' ? 'You' : 'AI'}:
                      </div>
                      <div style={{
                        flex: 1,
                        color: darkMode ? '#ddd' : '#333',
                        lineHeight: '1.5'
                      }}>
                        {item.text}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ color: darkMode ? '#ddd' : '#333' }}>
                    {transcript}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ 
                textAlign: 'center',
                padding: '24px 12px',
                backgroundColor: darkMode ? '#13141a' : '#f5f5f5',
                borderRadius: 8,
                color: darkMode ? '#9aa0b5' : '#666',
                fontSize: 14
              }}>
                {details && (details.status === 'in-progress' || details.status === 'pending') ? (
                  <div>
                    <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" style={{ marginRight: 8, animation: 'spin 1s linear infinite' }}>
                        <style>
                          {`
                            @keyframes spin {
                              0% { transform: rotate(0deg); }
                              100% { transform: rotate(360deg); }
                            }
                          `}
                        </style>
                        <path fill="currentColor" d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z" />
                      </svg>
                      Call in progress...
                    </div>
                    <div style={{ fontSize: 12 }}>Transcript is being generated in real-time</div>
                  </div>
                ) : details && (details.status === 'success' || details.status === 'completed') ? (
                  <div>
                    <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" style={{ marginRight: 8 }}>
                        <path fill="currentColor" d="M12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M16.24,7.76C15.07,6.58 13.53,6 12,6V12L7.76,16.24C10.1,18.58 13.9,18.58 16.24,16.24C18.59,13.9 18.59,10.1 16.24,7.76Z" />
                      </svg>
                      Processing transcript...
                    </div>
                    <div style={{ fontSize: 12 }}>Refreshing automatically every second</div>
                  </div>
                ) : (
                  <div>
                    <div style={{ marginBottom: 8 }}>
                      <svg width="24" height="24" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />
                      </svg>
                    </div>
                    <div>Transcript not available for this call</div>
                    <div style={{ fontSize: 12, marginTop: 8 }}>There might have been an issue with the transcription service</div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Recording Section */}
          {recordingUrl && (
            <div>
              <h3 style={{ 
                margin: '0 0 12px 0', 
                fontSize: 16,
                fontWeight: 500,
                color: darkMode ? '#eaebef' : '#333'
              }}>
                Recording
              </h3>
              
              <audio 
                controls 
                style={{ 
                  width: '100%',
                  borderRadius: 8,
                  backgroundColor: darkMode ? '#13141a' : '#f5f5f5',
                  padding: '8px'
                }}
              >
                <source src={recordingUrl} type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CallDetails;
