// src/screens/ChatScreen.js
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, StyleSheet, FlatList,
  TouchableOpacity, KeyboardAvoidingView, Platform,
  Alert, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import MessageBubble   from '../components/MessageBubble';
import ModelPicker     from '../components/ModelPicker';
import Sidebar         from '../components/Sidebar';

import { streamChat, MODELS, DEFAULT_MODEL } from '../services/groqService';
import {
  createSession, getSessions, getActiveId, setActiveId,
  getSession, deleteSession, renameSession, changeModel,
  clearSessionMessages, addMessage, getMessages, updateLastAssistantMessage,
} from '../store';

// ── Put your Groq API key here ────────────────────────────────────────────────
const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY;;
// ─────────────────────────────────────────────────────────────────────────────

import { Colors, S, F, R } from '../theme';

const SUGGESTIONS = [
  'Explain quantum entanglement simply',
  'Write a Python web scraper',
  'Tips for learning React Native',
  'Plan a 7-day trip to Japan',
];

export default function ChatScreen() {
  // ── Force re-render helper (since store is mutable) ──────────────────────
  const [tick, setTick]       = useState(0);
  const rerender              = () => setTick(t => t + 1);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [input,        setInput]       = useState('');
  const [streaming,    setStreaming]    = useState(null);  // { content: string }
  const [loading,      setLoading]     = useState(false);
  const [showModels,   setShowModels]  = useState(false);
  const [showSidebar,  setShowSidebar] = useState(false);

  const listRef   = useRef(null);
  const cancelRef = useRef(false);

  // ── Bootstrap: create first session ──────────────────────────────────────
  useEffect(() => {
    if (getSessions().length === 0) createSession(DEFAULT_MODEL);
    rerender();
  }, []);

  // ── Derived from store ────────────────────────────────────────────────────
  const sessions  = getSessions();
  const activeId  = getActiveId();
  const session   = getSession(activeId);
  const messages  = activeId ? getMessages(activeId) : [];
  const model     = session?.model ?? DEFAULT_MODEL;
  const modelLabel = MODELS.find(m => m.id === model)?.label ?? model;

  // ── Scroll to bottom on new message ──────────────────────────────────────
  useEffect(() => {
    if (messages.length || streaming) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 60);
    }
  }, [tick, streaming]);

  // ── Session actions ───────────────────────────────────────────────────────
  const newChat = useCallback(() => {
    createSession(model);
    setInput('');
    rerender();
  }, [model]);

  const selectSession = (id) => { setActiveId(id); rerender(); };

  const handleDelete = (id) => {
    deleteSession(id);
    if (getSessions().length === 0) createSession(model);
    rerender();
  };

  const handleModelChange = (id) => {
    if (activeId) changeModel(activeId, id);
    rerender();
  };

  const handleClear = () =>
    Alert.alert('Clear Chat', 'Delete all messages in this session?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: () => { clearSessionMessages(activeId); rerender(); } },
    ]);

  // ── Send message ──────────────────────────────────────────────────────────
  const send = useCallback(async (text) => {
    text = (text ?? input).trim();
    if (!text || loading) return;

    if (!GROQ_API_KEY || GROQ_API_KEY === 'YOUR_GROQ_API_KEY') {
      Alert.alert('API Key Missing', 'Open ChatScreen.js and replace YOUR_GROQ_API_KEY with your key from console.groq.com/keys');
      return;
    }

    setInput('');
    setLoading(true);
    cancelRef.current = false;

    // Add user message
    addMessage(activeId, 'user', text);

    // Auto-title after first message
    if (messages.length === 0) {
      renameSession(activeId, text.slice(0, 45));
    }

    rerender();

    // Build history for API
    const history = getMessages(activeId).map(({ role, content }) => ({ role, content }));

    // Add placeholder assistant message
    addMessage(activeId, 'assistant', '');
    rerender();

    setStreaming({ content: '' });
    let fullReply = '';

    try {
      fullReply = await streamChat(
        history,
        model,
        GROQ_API_KEY,
        (chunk) => {
          fullReply += chunk;
          setStreaming({ content: fullReply });
          updateLastAssistantMessage(activeId, fullReply);
        },
        () => cancelRef.current,
      );
    } catch (e) {
      fullReply = `⚠️ ${e.message}`;
      updateLastAssistantMessage(activeId, fullReply);
    }

    // Finalise
    updateLastAssistantMessage(activeId, fullReply || '(no response)');
    setStreaming(null);
    setLoading(false);
    rerender();
  }, [input, loading, activeId, model, messages.length]);

  // ── Display list = stored messages + streaming overlay ───────────────────
  const displayMessages = streaming
    ? messages.map((m, i) =>
        i === messages.length - 1 && m.role === 'assistant'
          ? { ...m, content: streaming.content }
          : m
      )
    : messages;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.hBtn} onPress={() => setShowSidebar(true)}>
          <Ionicons name="menu" size={22} color={Colors.text} />
        </TouchableOpacity>

        <View style={styles.hCenter}>
          <View style={{ flexDirection:'row', alignItems:'center', gap:5 }}>
            <Ionicons name="flash" size={15} color={Colors.primary} />
            <Text style={styles.hTitle}>Groq-bot</Text>
          </View>
          {session && (
            <Text style={styles.hSub} numberOfLines={1}>{session.title}</Text>
          )}
        </View>

        <View style={{ flexDirection:'row', alignItems:'center', gap:6 }}>
          <TouchableOpacity style={styles.modelBadge} onPress={() => setShowModels(true)} activeOpacity={0.7}>
            <Ionicons name="git-branch-outline" size={11} color={Colors.primaryLight} />
            <Text style={styles.modelBadgeText} numberOfLines={1}>{modelLabel}</Text>
            <Ionicons name="chevron-down" size={11} color={Colors.primaryLight} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.hBtn} onPress={handleClear}>
            <Ionicons name="trash-outline" size={18} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages / Welcome */}
      <KeyboardAvoidingView style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

        {displayMessages.length === 0 ? (
          <View style={styles.welcome}>
            <View style={styles.welcomeIcon}>
              <Ionicons name="flash" size={34} color={Colors.primary} />
            </View>
            <Text style={styles.welcomeTitle}>How can I help?</Text>
            <Text style={styles.welcomeSub}>{modelLabel} · Groq ultra-fast inference</Text>
            <View style={styles.chips}>
              {SUGGESTIONS.map((s, i) => (
                <TouchableOpacity key={i} style={styles.chip} onPress={() => send(s)} activeOpacity={0.75}>
                  <Text style={styles.chipText}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={displayMessages}
            keyExtractor={m => m.id}
            contentContainerStyle={{ paddingVertical: S.md }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <MessageBubble
                message={item}
                isStreaming={streaming !== null && item === displayMessages[displayMessages.length - 1] && item.role === 'assistant'}
              />
            )}
          />
        )}

        {/* Input bar */}
        <View style={styles.inputWrap}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder="Message Groq-bot..."
              placeholderTextColor={Colors.textMuted}
              multiline
              maxLength={4000}
            />
            {loading ? (
              <TouchableOpacity style={styles.sendBtn} onPress={() => cancelRef.current = true}>
                <View style={styles.stopBox} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.sendBtn, !input.trim() && styles.sendBtnOff]}
                onPress={() => send()}
                disabled={!input.trim()}
              >
                <Ionicons name="arrow-up" size={17} color={input.trim() ? Colors.white : Colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.hint}>AI can make mistakes. Verify important info.</Text>
        </View>
      </KeyboardAvoidingView>

      {/* Modals */}
      <ModelPicker visible={showModels} selected={model}
        onSelect={handleModelChange} onClose={() => setShowModels(false)} />

      <Sidebar visible={showSidebar} sessions={sessions} activeId={activeId}
        onSelect={selectSession} onNew={() => { newChat(); setShowSidebar(false); }}
        onDelete={handleDelete} onClose={() => setShowSidebar(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:         { flex:1, backgroundColor:Colors.background },
  flex:         { flex:1 },

  header:       { flexDirection:'row', alignItems:'center', paddingHorizontal:S.md,
                  paddingVertical:11, borderBottomWidth:1, borderColor:Colors.border, gap:S.sm },
  hBtn:         { width:36, height:36, alignItems:'center', justifyContent:'center', borderRadius:R.sm },
  hCenter:      { flex:1, alignItems:'center' },
  hTitle:       { fontSize:F.md, fontWeight:'700', color:Colors.text },
  hSub:         { fontSize:F.xs, color:Colors.textMuted, marginTop:1, maxWidth:170 },

  modelBadge:   { flexDirection:'row', alignItems:'center', backgroundColor:Colors.surfaceHigh,
                  borderRadius:R.full, paddingVertical:5, paddingHorizontal:9,
                  borderWidth:1, borderColor:Colors.border, gap:3, maxWidth:115 },
  modelBadgeText:{ fontSize:F.xs, color:Colors.primaryLight, fontWeight:'600' },

  inputWrap:    { paddingHorizontal:S.md, paddingTop:S.sm, paddingBottom:S.sm,
                  borderTopWidth:1, borderColor:Colors.border, backgroundColor:Colors.background },
  inputRow:     { flexDirection:'row', alignItems:'flex-end', backgroundColor:Colors.surfaceHigh,
                  borderRadius:R.lg, borderWidth:1, borderColor:Colors.border,
                  paddingHorizontal:S.md, paddingVertical:8, gap:S.sm },
  input:        { flex:1, fontSize:F.md, color:Colors.text, maxHeight:120, lineHeight:22, paddingVertical:4 },
  sendBtn:      { width:34, height:34, borderRadius:17, backgroundColor:Colors.primary,
                  alignItems:'center', justifyContent:'center', alignSelf:'flex-end' },
  sendBtnOff:   { backgroundColor:Colors.surfaceHigh, borderWidth:1, borderColor:Colors.border },
  stopBox:      { width:12, height:12, backgroundColor:Colors.text, borderRadius:2 },
  hint:         { fontSize:F.xs, color:Colors.textMuted, textAlign:'center', marginTop:5 },

  welcome:      { flex:1, alignItems:'center', justifyContent:'center', paddingHorizontal:S.xl },
  welcomeIcon:  { width:70, height:70, borderRadius:18, backgroundColor:Colors.surfaceHigh,
                  alignItems:'center', justifyContent:'center', marginBottom:S.lg,
                  borderWidth:1, borderColor:Colors.border },
  welcomeTitle: { fontSize:F.xxl, fontWeight:'700', color:Colors.text, marginBottom:4 },
  welcomeSub:   { fontSize:F.sm, color:Colors.textSecondary, marginBottom:S.xl },
  chips:        { width:'100%', gap:S.sm },
  chip:         { backgroundColor:Colors.surfaceHigh, borderRadius:R.md, padding:S.md,
                  borderWidth:1, borderColor:Colors.border },
  chipText:     { fontSize:F.sm, color:Colors.textSecondary },
});