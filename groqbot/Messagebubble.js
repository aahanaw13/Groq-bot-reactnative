// src/components/MessageBubble.js
import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { Colors, S, F, R } from '../theme';

const MessageBubble = memo(({ message, isStreaming }) => {
  const isUser = message.role === 'user';

  const time = message.ts
    ? new Date(message.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  const copy = () => Clipboard.setStringAsync(message.content);

  return (
    <View style={[styles.row, isUser ? styles.rowUser : styles.rowBot]}>
      {/* Bot avatar */}
      {!isUser && (
        <View style={styles.avatar}>
          <Ionicons name="flash" size={13} color={Colors.primary} />
        </View>
      )}

      <View style={[styles.col, isUser ? styles.colUser : styles.colBot]}>
        {/* Bubble */}
        <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleBot]}>
          <Text
            style={[styles.text, isUser ? styles.textUser : styles.textBot]}
            selectable
          >
            {message.content}
            {isStreaming && <Text style={styles.cursor}>▋</Text>}
          </Text>
        </View>

        {/* Footer */}
        <View style={[styles.footer, isUser ? styles.footerUser : styles.footerBot]}>
          {!!time && <Text style={styles.time}>{time}</Text>}
          {!isStreaming && !!message.content && (
            <TouchableOpacity onPress={copy} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
              <Ionicons name="copy-outline" size={11} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* User avatar */}
      {isUser && (
        <View style={[styles.avatar, styles.avatarUser]}>
          <Ionicons name="person" size={13} color={Colors.white} />
        </View>
      )}
    </View>
  );
});

export default MessageBubble;

const styles = StyleSheet.create({
  row:        { flexDirection:'row', alignItems:'flex-end', marginVertical:4, paddingHorizontal:S.md },
  rowUser:    { justifyContent:'flex-end' },
  rowBot:     { justifyContent:'flex-start' },

  avatar:     { width:28, height:28, borderRadius:14, backgroundColor:Colors.surfaceHigh,
                alignItems:'center', justifyContent:'center', borderWidth:1, borderColor:Colors.border, marginBottom:18 },
  avatarUser: { backgroundColor:Colors.primaryDark, marginLeft:S.sm, borderColor:Colors.primaryLight },

  col:        { maxWidth:'75%', marginHorizontal:S.sm },
  colUser:    { alignItems:'flex-end' },
  colBot:     { alignItems:'flex-start' },

  bubble:     { paddingHorizontal:14, paddingVertical:10, borderRadius:R.md },
  bubbleUser: { backgroundColor:Colors.userBubble, borderBottomRightRadius:4 },
  bubbleBot:  { backgroundColor:Colors.assistantBubble, borderBottomLeftRadius:4, borderWidth:1, borderColor:Colors.border },

  text:       { fontSize:F.md, lineHeight:22 },
  textUser:   { color:Colors.userBubbleText },
  textBot:    { color:Colors.assistantBubbleText },
  cursor:     { color:Colors.primaryLight },

  footer:     { flexDirection:'row', alignItems:'center', marginTop:3, gap:6 },
  footerUser: { justifyContent:'flex-end' },
  footerBot:  { justifyContent:'flex-start' },
  time:       { fontSize:F.xs, color:Colors.textMuted },
});