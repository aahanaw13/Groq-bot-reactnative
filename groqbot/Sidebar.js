// src/components/Sidebar.js
import React from 'react';
import {
  Modal, View, Text, StyleSheet, FlatList,
  TouchableOpacity, TouchableWithoutFeedback,
  Alert, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, S, F, R } from '../theme';

const W = Math.min(Dimensions.get('window').width * 0.78, 300);

const ago = (ts) => {
  const d = Date.now() - ts;
  if (d < 60000)      return 'just now';
  if (d < 3600000)    return `${Math.floor(d / 60000)}m ago`;
  if (d < 86400000)   return `${Math.floor(d / 3600000)}h ago`;
  return new Date(ts).toLocaleDateString();
};

export default function Sidebar({ visible, sessions, activeId, onSelect, onNew, onDelete, onClose }) {
  const confirmDelete = (session) =>
    Alert.alert('Delete Chat', `Delete "${session.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => onDelete(session.id) },
    ]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>

        <View style={styles.panel}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logo}>
              <Ionicons name="flash" size={18} color={Colors.primary} />
              <Text style={styles.logoText}>Groq-bot</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top:8,bottom:8,left:8,right:8 }}>
              <Ionicons name="close" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* New chat */}
          <TouchableOpacity style={styles.newBtn} onPress={onNew} activeOpacity={0.8}>
            <Ionicons name="add" size={17} color={Colors.white} />
            <Text style={styles.newBtnText}>New Chat</Text>
          </TouchableOpacity>

          <Text style={styles.sectionLabel}>History</Text>

          <FlatList
            data={sessions}
            keyExtractor={s => s.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: S.xl }}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons name="chatbubbles-outline" size={30} color={Colors.textMuted} />
                <Text style={styles.emptyText}>No chats yet</Text>
              </View>
            }
            renderItem={({ item }) => {
              const active = item.id === activeId;
              return (
                <TouchableOpacity
                  style={[styles.item, active && styles.itemActive]}
                  onPress={() => { onSelect(item.id); onClose(); }}
                  onLongPress={() => confirmDelete(item)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="chatbubble-outline" size={13}
                    color={active ? Colors.primary : Colors.textMuted}
                    style={{ marginRight:S.sm, marginTop:1 }} />
                  <View style={styles.itemText}>
                    <Text style={[styles.itemTitle, active && styles.itemTitleActive]} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.itemMeta}>{ago(item.createdAt)}</Text>
                  </View>
                  <TouchableOpacity onPress={() => confirmDelete(item)}
                    hitSlop={{ top:8,bottom:8,left:8,right:8 }}>
                    <Ionicons name="trash-outline" size={13} color={Colors.textMuted} />
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root:          { flex:1, flexDirection:'row' },
  overlay:       { flex:1, backgroundColor:'rgba(0,0,0,0.5)' },
  panel:         { width:W, backgroundColor:Colors.surface, paddingTop:52,
                   paddingHorizontal:S.md, borderLeftWidth:1, borderColor:Colors.border },

  header:        { flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:S.lg },
  logo:          { flexDirection:'row', alignItems:'center', gap:S.sm },
  logoText:      { fontSize:F.lg, fontWeight:'700', color:Colors.text },

  newBtn:        { flexDirection:'row', alignItems:'center', backgroundColor:Colors.primary,
                   borderRadius:R.md, paddingVertical:11, paddingHorizontal:S.md,
                   marginBottom:S.lg, gap:S.sm },
  newBtnText:    { color:Colors.white, fontWeight:'600', fontSize:F.md },

  sectionLabel:  { fontSize:F.xs, color:Colors.textMuted, textTransform:'uppercase',
                   letterSpacing:0.9, fontWeight:'600', marginBottom:S.sm },

  item:          { flexDirection:'row', alignItems:'center', paddingVertical:9,
                   paddingHorizontal:S.sm, borderRadius:R.sm, marginBottom:2 },
  itemActive:    { backgroundColor:Colors.surfaceHigh },
  itemText:      { flex:1 },
  itemTitle:     { fontSize:F.sm, color:Colors.textSecondary, fontWeight:'500' },
  itemTitleActive:{ color:Colors.text },
  itemMeta:      { fontSize:F.xs, color:Colors.textMuted, marginTop:1 },

  empty:         { alignItems:'center', paddingTop:S.xl, gap:S.sm },
  emptyText:     { fontSize:F.sm, color:Colors.textMuted },
});