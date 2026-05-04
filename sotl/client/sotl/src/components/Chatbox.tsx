import React, { useEffect, useRef, useMemo, useState } from 'react';
import {
  Paper,
  Typography,
  Box,
  TextField,
  IconButton,
  Tooltip,
  Chip,
  Popover,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import ReactMarkdown from 'react-markdown';

import { useChatboxController } from '../hooks/useChatboxController';
import { formatDueCompact, isOverdue, daysOverdue } from '../utils/date';

/* ===================== Chatbox ===================== */

const Chatbox: React.FC = () => {
  const controller = useChatboxController();
  const {
    token,
    messages,
    input,
    setInput,
    isOpen,
    setIsOpen,
    nextDeadline,
    suggestions,
    role,
    activeProjectTitle,
    isTyping,
    notificationCount,
    handleSend,
    onTaskClick,
    onUndoTaskClick,
    onConfirmDoneYes,
    onConfirmDoneNo,
    onPendingFileInputChange,
    onUploadAndSubmit,
    onUploadCancel,
    onMarkProgress,
    onMarkDone,
    onGetHelp,
  } = controller;

  const endRef = useRef<HTMLDivElement | null>(null);
  const [helpAnchor, setHelpAnchor] = useState<HTMLElement | null>(null);

  const handleHelpClick = (event: React.MouseEvent<HTMLElement>) => {
    setHelpAnchor(event.currentTarget);
  };

  const handleHelpClose = () => {
    setHelpAnchor(null);
  };

  const helpOpen = Boolean(helpAnchor);

  // markdown spacing fix (keeps your bubbles tight)
  const mdComponents = useMemo(
    () => ({
      p: ({ children }: any) => (
        <span style={{ display: 'block', margin: 0, lineHeight: '1.3' }}>{children}</span>
      ),
      a: ({ href, children }: any) => (
        <a href={href} target="_blank" rel="noreferrer">
          {children}
        </a>
      ),
    }),
    []
  );

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  if (!token) return null;

  return (
    <>
      {!isOpen && (
        <Tooltip title="Open Assistant">
          <Box
            sx={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              width: 56,
              height: 56,
              borderRadius: '50%',
              bgcolor: '#3f51b5',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(63, 81, 181, 0.4)',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'scale(1.1)',
                boxShadow: '0 6px 16px rgba(63, 81, 181, 0.5)',
              },
            }}
            onClick={() => setIsOpen(true)}
          >
            {notificationCount > 0 && (
              <Box
                sx={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  background: '#ff4444',
                  color: 'white',
                  borderRadius: '50%',
                  width: 24,
                  height: 24,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  border: '2px solid white',
                  boxShadow: '0 2px 6px rgba(255, 68, 68, 0.4)',
                }}
              >
                {notificationCount}
              </Box>
            )}
            <ChatBubbleOutlineIcon />
          </Box>
        </Tooltip>
      )}

      {isOpen && (
        <Paper
          elevation={8}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,

            width: 420,
            height: 560,

            minWidth: 300,
            minHeight: 360,
            maxWidth: '90vw',
            maxHeight: '90vh',

            display: 'flex',
            flexDirection: 'column',

            overflow: 'auto',
            resize: 'both',

            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
          }}
        >
          {/* Header */}
          <Box
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#fff',
              px: 2.5,
              py: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            }}
          >
            <Box sx={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: 0.8 }}>
              <Typography fontWeight={700} sx={{ lineHeight: 1.1 }}>
                Personalised Assistant
              </Typography>
              <Tooltip title="Help & Commands">
                <IconButton
                  size="small"
                  onClick={handleHelpClick}
                  sx={{
                    color: '#fff',
                    padding: '4px',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' },
                  }}
                >
                  <HelpOutlineIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                size="small"
                sx={{
                  bgcolor: 'rgba(255,255,255,0.18)',
                  color: '#fff',
                  fontWeight: 600,
                }}
                label={nextDeadline ? `Next: ${nextDeadline.daysLeft}d` : 'Next: -'}
              />
              <Typography
                sx={{
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: 24,
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'scale(1.2)' },
                }}
                onClick={() => setIsOpen(false)}
              >
                ×
              </Typography>
            </Box>
          </Box>

          {/* messages */}
          <Box sx={{ flex: 1, p: 2, overflowY: 'auto' }}>
            {messages.map((m, i) => {
              // USER / SYSTEM TEXT
              if (!('kind' in m) || m.kind === 'text' || m.kind === undefined) {
                const isUser = m.sender === 'user';
                return (
                  <Box key={i} sx={{ mb: 1, textAlign: isUser ? 'right' : 'left' }}>
                    <Typography
                      sx={{
                        display: 'inline-block',
                        p: 1,
                        borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        background: isUser
                          ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                          : '#f5f5f5',
                        color: isUser ? 'white' : '#333',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        maxWidth: '85%',
                        lineHeight: 1.3,
                        fontSize: '0.95rem',
                        textAlign: isUser ? 'left' : 'justify',
                        boxShadow: isUser
                          ? '0 2px 8px rgba(102, 126, 234, 0.3)'
                          : '0 1px 3px rgba(0, 0, 0, 0.1)',
                      }}
                    >
                      <ReactMarkdown components={mdComponents as any}>
                        {m.text.replace(/\n/g, '  \n')}
                      </ReactMarkdown>
                    </Typography>
                  </Box>
                );
              }

              // TASK LIST (clickable)
              if (m.kind === 'tasks') {
                return (
                  <Box key={i} sx={{ mb: 1.5, textAlign: 'left' }}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        borderRadius: 3,
                        bgcolor: '#f8f9fa',
                        maxWidth: '92%',
                        border: '1px solid #e0e0e0',
                      }}
                    >
                      <Typography sx={{ fontWeight: 700, mb: 0.5, fontSize: 15, color: '#333' }}>
                        📌 My Tasks <span style={{ fontWeight: 400, color: '#666' }}>({m.projectTitle})</span>
                      </Typography>

                      <Typography sx={{ fontSize: 12, color: '#666', mb: 1 }}>
                        Click a task to mark it done and upload evidence.
                      </Typography>

                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                        {m.tasks.map((t) => {
                          const isClickable = t.status !== 'done' && t.status !== 'cancelled';
                          const taskOverdue = isOverdue(t.dueAt, t.status);
                          const daysLate = taskOverdue ? daysOverdue(t.dueAt, t.status) : 0;
                          
                          return (
                            <Box
                              key={t.id}
                              onClick={isClickable ? () => onTaskClick(t) : undefined}
                              sx={{
                                p: 1.2,
                                borderRadius: 2,
                                cursor: isClickable ? 'pointer' : 'default',
                                bgcolor: taskOverdue ? '#fee' : '#fff',
                                border: taskOverdue ? '1px solid #f44336' : '1px solid #e0e0e0',
                                transition: 'all 0.2s ease',
                                opacity: isClickable ? 1 : 0.6,
                                '&:hover': isClickable ? {
                                  bgcolor: taskOverdue ? '#fdd' : '#f0f4ff',
                                  borderColor: taskOverdue ? '#d32f2f' : '#667eea',
                                  transform: 'translateX(4px)',
                                  boxShadow: taskOverdue 
                                    ? '0 2px 8px rgba(244, 67, 54, 0.25)' 
                                    : '0 2px 8px rgba(102, 126, 234, 0.15)',
                                } : {},
                              }}
                            >
                              <Typography sx={{ fontWeight: 600, lineHeight: 1.3, fontSize: 14, color: '#333' }}>
                                {t.status === 'done' ? '✅' : t.status === 'in_progress' ? '🟡' : '📝'} {t.title}
                                {taskOverdue && <span style={{ color: '#f44336', marginLeft: 8 }}>⚠️ {daysLate}d overdue</span>}
                              </Typography>
                              <Typography sx={{ fontSize: 12, color: '#666', mt: 0.3 }}>
                                {t.status.replace(/_/g, ' ')}
                                {t.dueAt ? ` • Due ${formatDueCompact(t.dueAt)}` : ''}
                              </Typography>
                            </Box>
                          );
                        })}
                      </Box>
                    </Paper>
                  </Box>
                );
              }

              // UNDO TASK LIST (clickable for leaders)
              if (m.kind === 'undo_tasks') {
                return (
                  <Box key={i} sx={{ mb: 1.5, textAlign: 'left' }}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        borderRadius: 3,
                        bgcolor: '#fff3e0',
                        maxWidth: '92%',
                        border: '1px solid #ffb74d',
                      }}
                    >
                      <Typography sx={{ fontWeight: 700, mb: 0.5, fontSize: 15, color: '#333' }}>
                        ↩️ Cancel Tasks <span style={{ fontWeight: 400, color: '#666' }}>({m.projectTitle})</span>
                      </Typography>

                      <Typography sx={{ fontSize: 12, color: '#666', mb: 1 }}>
                        Click a task to cancel it.
                      </Typography>

                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                        {m.tasks.map((t) => (
                          <Box
                            key={t.id}
                            onClick={() => onUndoTaskClick(t)}
                            sx={{
                              p: 1.2,
                              borderRadius: 2,
                              cursor: 'pointer',
                              bgcolor: '#fff',
                              border: '1px solid #ffb74d',
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                bgcolor: '#ffe0b2',
                                borderColor: '#ff9800',
                                transform: 'translateX(4px)',
                                boxShadow: '0 2px 8px rgba(255, 152, 0, 0.15)',
                              },
                            }}
                          >
                            <Typography sx={{ fontWeight: 600, lineHeight: 1.3, fontSize: 14, color: '#333' }}>
                              {t.status === 'in_progress' ? '🟡' : '📝'} {t.title}
                            </Typography>
                            <Typography sx={{ fontSize: 12, color: '#666', mt: 0.3 }}>
                              {t.status.replace(/_/g, ' ')}
                              {t.dueAt ? ` • Due ${formatDueCompact(t.dueAt)}` : ''}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </Paper>
                  </Box>
                );
              }

              // TASK DETAILS - Show before marking done
              if (m.kind === 'task_details') {
                const t = m.task;
                const taskOverdue = isOverdue(t.dueAt, t.status);
                const daysLate = taskOverdue ? daysOverdue(t.dueAt, t.status) : 0;
                
                return (
                  <Box key={i} sx={{ mb: 1.5, textAlign: 'left' }}>
                    <Paper
                      elevation={2}
                      sx={{
                        p: 2.5,
                        borderRadius: 3,
                        bgcolor: '#ffffff',
                        maxWidth: '92%',
                        border: taskOverdue ? '2px solid #f44336' : '1px solid #e0e7ff',
                      }}
                    >
                      <Typography sx={{ fontWeight: 600, mb: 2, color: '#0f172a', fontSize: 17 }}>
                        📋 {t.title}
                      </Typography>

                      {taskOverdue && (
                        <Box sx={{ 
                          mb: 2, 
                          p: 1.5, 
                          bgcolor: '#fee', 
                          borderRadius: 2, 
                          border: '1px solid #f44336',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1
                        }}>
                          <Typography sx={{ fontSize: 14, color: '#d32f2f', fontWeight: 600 }}>
                            ⚠️ This task is {daysLate} day{daysLate > 1 ? 's' : ''} overdue!
                          </Typography>
                        </Box>
                      )}

                      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                        <Box sx={{ 
                          px: 1.5, 
                          py: 0.5, 
                          bgcolor: t.status === 'assigned' ? '#fef3c7' : t.status === 'in_progress' ? '#dbeafe' : '#d1fae5',
                          borderRadius: 2,
                          fontSize: 13,
                          fontWeight: 600,
                          color: t.status === 'assigned' ? '#78350f' : t.status === 'in_progress' ? '#1e3a8a' : '#064e3b',
                          textTransform: 'capitalize'
                        }}>
                          {t.status.replace(/_/g, ' ')}
                        </Box>
                        {t.dueAt && (
                          <Typography sx={{ fontSize: 13, color: taskOverdue ? '#d32f2f' : '#475569', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            📅 {formatDueCompact(t.dueAt)}
                          </Typography>
                        )}
                      </Box>

                      {t.description && (
                        <Box sx={{ 
                          mb: 2, 
                          p: 2, 
                          bgcolor: '#f8fafc', 
                          borderRadius: 2, 
                          borderLeft: '3px solid #667eea' 
                        }}>
                          <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#475569', mb: 0.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            Description
                          </Typography>
                          <Typography sx={{ fontSize: 14, color: '#1e293b', lineHeight: 1.6, fontWeight: 500 }}>
                            {t.description}
                          </Typography>
                        </Box>
                      )}

                      <Box sx={{ 
                        display: 'flex', 
                        gap: 1, 
                        pt: 1.5, 
                        borderTop: '1px solid #f1f5f9',
                        flexWrap: 'wrap'
                      }}>
                        {t.status === 'assigned' && (
                          <>
                            <Chip
                              label="🟡 Mark In Progress"
                              onClick={onMarkProgress}
                              sx={{
                                bgcolor: '#2196f3',
                                color: '#fff',
                                fontWeight: 600,
                                cursor: 'pointer',
                                '&:hover': { bgcolor: '#1976d2' },
                              }}
                            />
                            <Chip
                              label="✅ Mark Done"
                              onClick={onMarkDone}
                              sx={{
                                bgcolor: '#4caf50',
                                color: '#fff',
                                fontWeight: 600,
                                cursor: 'pointer',
                                '&:hover': { bgcolor: '#45a049' },
                              }}
                            />
                          </>
                        )}
                        {t.status === 'in_progress' && (
                          <Chip
                            label="✅ Mark Done"
                            onClick={onMarkDone}
                            sx={{
                              bgcolor: '#4caf50',
                              color: '#fff',
                              fontWeight: 600,
                              cursor: 'pointer',
                              '&:hover': { bgcolor: '#45a049' },
                            }}
                          />
                        )}
                        <Chip
                          label="💡 Get Help"
                          onClick={onGetHelp}
                          sx={{
                            bgcolor: '#667eea',
                            color: '#fff',
                            fontWeight: 600,
                            cursor: 'pointer',
                            '&:hover': { bgcolor: '#764ba2' },
                          }}
                        />
                      </Box>
                    </Paper>
                  </Box>
                );
              }

              // CONFIRM DONE
              if (m.kind === 'confirm_done') {
                const t = m.task;
                return (
                  <Box key={i} sx={{ mb: 1.5, textAlign: 'left' }}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        borderRadius: 3,
                        bgcolor: '#fff9e6',
                        maxWidth: '92%',
                        border: '1px solid #ffd966',
                      }}
                    >
                      <Typography sx={{ fontWeight: 600, mb: 1.2, color: '#333', fontSize: 14 }}>
                        Mark <strong>{t.title}</strong> as done?
                      </Typography>

                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Chip
                          label="Yes"
                          onClick={() => onConfirmDoneYes(t)}
                          sx={{
                            bgcolor: '#4caf50',
                            color: '#fff',
                            fontWeight: 600,
                            '&:hover': { bgcolor: '#45a049' },
                          }}
                        />
                        <Chip
                          label="No"
                          onClick={() => onConfirmDoneNo()}
                          sx={{
                            bgcolor: '#f44336',
                            color: '#fff',
                            fontWeight: 600,
                            '&:hover': { bgcolor: '#da190b' },
                          }}
                        />
                      </Box>
                    </Paper>
                  </Box>
                );
              }

              // UPLOAD EVIDENCE UI
              if (m.kind === 'upload_evidence') {
                const t = m.task;
                return (
                  <Box key={i} sx={{ mb: 1.5, textAlign: 'left' }}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        borderRadius: 3,
                        bgcolor: '#e8f5e9',
                        maxWidth: '92%',
                        border: '1px solid #81c784',
                      }}
                    >
                      <Typography sx={{ fontWeight: 600, mb: 1.2, color: '#333', fontSize: 14 }}>
                        📎 Upload evidence (PDF/DOC/DOCX) for **{t.title}**
                      </Typography>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        onChange={onPendingFileInputChange}
                        style={{
                          marginBottom: '12px',
                          padding: '8px',
                          borderRadius: '8px',
                          border: '1px solid #81c784',
                          backgroundColor: '#fff',
                          width: '100%',
                        }}
                      />

                      <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                        <Chip
                          label="⬆️ Upload & Submit"
                          onClick={async () => onUploadAndSubmit(t)}
                          sx={{
                            bgcolor: '#2196f3',
                            color: '#fff',
                            fontWeight: 600,
                            '&:hover': { bgcolor: '#1976d2' },
                          }}
                        />
                        <Chip
                          label="Cancel"
                          onClick={() => onUploadCancel()}
                          sx={{
                            bgcolor: '#9e9e9e',
                            color: '#fff',
                            fontWeight: 600,
                            '&:hover': { bgcolor: '#757575' },
                          }}
                        />
                      </Box>
                    </Paper>
                  </Box>
                );
              }

              return null;
            })}
            
            {/* Typing Indicator */}
            {isTyping && (
              <Box sx={{ mb: 1, textAlign: 'left' }}>
                <Box
                  sx={{
                    display: 'inline-block',
                    p: 1.2,
                    borderRadius: '16px 16px 16px 4px',
                    bgcolor: '#f5f5f5',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: '#667eea',
                        animation: 'typing-dot 1.4s infinite ease-in-out',
                        animationDelay: '0s',
                        '@keyframes typing-dot': {
                          '0%, 60%, 100%': { transform: 'translateY(0)' },
                          '30%': { transform: 'translateY(-10px)' },
                        },
                      }}
                    />
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: '#667eea',
                        animation: 'typing-dot 1.4s infinite ease-in-out',
                        animationDelay: '0.2s',
                        '@keyframes typing-dot': {
                          '0%, 60%, 100%': { transform: 'translateY(0)' },
                          '30%': { transform: 'translateY(-10px)' },
                        },
                      }}
                    />
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: '#667eea',
                        animation: 'typing-dot 1.4s infinite ease-in-out',
                        animationDelay: '0.4s',
                        '@keyframes typing-dot': {
                          '0%, 60%, 100%': { transform: 'translateY(0)' },
                          '30%': { transform: 'translateY(-10px)' },
                        },
                      }}
                    />
                  </Box>
                </Box>
              </Box>
            )}
            
            <div ref={endRef} />
          </Box>
          {/* input */}
          <Box sx={{ display: 'flex', p: 1.5, gap: 1, bgcolor: '#fafafa', borderTop: '1px solid #e0e0e0' }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Type a message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                  bgcolor: '#fff',
                  '&:hover fieldset': { borderColor: '#667eea' },
                  '&.Mui-focused fieldset': { borderColor: '#667eea' },
                },
              }}
            />
            <IconButton
              onClick={handleSend}
              sx={{
                bgcolor: '#667eea',
                color: '#fff',
                '&:hover': { bgcolor: '#764ba2' },
                transition: 'all 0.3s ease',
              }}
            >
              <SendIcon />
            </IconButton>
          </Box>
        </Paper>
      )}

      {/* Help Popover */}
      <Popover
        open={helpOpen}
        anchorEl={helpAnchor}
        onClose={handleHelpClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        slotProps={{
          paper: {
            sx: {
              ml: -27,
            }
          }
        }}
      >
        <Box sx={{ p: 2.5, maxWidth: 380 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5, color: '#667eea' }}>
            📚 Chatbox Commands
          </Typography>
          
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.8, color: '#333' }}>
            Getting Started:
          </Typography>
          <Box sx={{ mb: 2, fontSize: '0.9rem', color: '#555', lineHeight: 1.6 }}>
            • <code style={{ backgroundColor: '#f5f5f5', padding: '2px 6px', borderRadius: 4 }}>projects</code> — View your projects<br />
            • <code style={{ backgroundColor: '#f5f5f5', padding: '2px 6px', borderRadius: 4 }}>1</code> or <code style={{ backgroundColor: '#f5f5f5', padding: '2px 6px', borderRadius: 4 }}>2</code> — Select a project by number<br />
            • <code style={{ backgroundColor: '#f5f5f5', padding: '2px 6px', borderRadius: 4 }}>members</code> — See team members
          </Box>

          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.8, color: '#333' }}>
            👑 Leader Commands:
          </Typography>
          <Box sx={{ mb: 2, fontSize: '0.9rem', color: '#555', lineHeight: 1.6 }}>
            • <code style={{ backgroundColor: '#f5f5f5', padding: '2px 6px', borderRadius: 4 }}>team</code> — View all team tasks<br />
            • <code style={{ backgroundColor: '#f5f5f5', padding: '2px 6px', borderRadius: 4 }}>assign &lt;matric&gt; &lt;task&gt; by &lt;date&gt;</code><br />
            <span style={{ marginLeft: '1rem', fontSize: '0.85rem', color: '#888' }}>Example: assign S10001 Write Report by Jan 15</span><br />
            • <code style={{ backgroundColor: '#f5f5f5', padding: '2px 6px', borderRadius: 4 }}>undo</code> — Show tasks you can cancel (click to undo)
          </Box>

          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.8, color: '#333' }}>
            👤 Member Commands:
          </Typography>
          <Box sx={{ mb: 2, fontSize: '0.9rem', color: '#555', lineHeight: 1.6 }}>
            • <code style={{ backgroundColor: '#f5f5f5', padding: '2px 6px', borderRadius: 4 }}>my</code> — View your tasks<br />
            • Click on tasks to mark done & upload evidence
          </Box>

          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.8, color: '#333' }}>
            Other Commands:
          </Typography>
          <Box sx={{ fontSize: '0.9rem', color: '#555', lineHeight: 1.6 }}>
            • <code style={{ backgroundColor: '#f5f5f5', padding: '2px 6px', borderRadius: 4 }}>next</code> — Next deliverable deadline<br />
            • <code style={{ backgroundColor: '#f5f5f5', padding: '2px 6px', borderRadius: 4 }}>deadlines</code> — Upcoming deadlines<br />
            • <code style={{ backgroundColor: '#f5f5f5', padding: '2px 6px', borderRadius: 4 }}>reset</code> — Clear project selection<br />
            • <code style={{ backgroundColor: '#f5f5f5', padding: '2px 6px', borderRadius: 4 }}>commands</code> — Show all commands
          </Box>

          {activeProjectTitle && (
            <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #e0e0e0' }}>
              <Typography variant="caption" sx={{ color: '#666' }}>
                Current project: <strong>{activeProjectTitle}</strong>
              </Typography>
            </Box>
          )}
        </Box>
      </Popover>
    </>
  );
};

export default Chatbox;
