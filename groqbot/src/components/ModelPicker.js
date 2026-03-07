// src/components/ModelPicker.js
import React from 'react';
import {
  Modal, View, Text, StyleSheet, FlatList,
  TouchableOpacity, TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MODELS } from '../services/groqService';
import { Colors, S, F, R } from '../theme';

export default function ModelPicker({ visible, selected, onSelect, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.title}>Choose Model</Text>
        <Text style={styles.sub}>Powered by Groq ultra-fast inference</Text>

        <FlatList
          data={MODELS}
          keyExtractor={m => m.id}
          contentContainerStyle={{ paddingBottom: S.xl }}
          renderItem={({ item }) => {
            const active = item.id === selected;
            return (
              <TouchableOpacity
                style={[styles.card, active && styles.cardActive]}
                onPress={() => { onSelect(item.id); onClose(); }}
                activeOpacity={0.75}
              >
                <View style={[styles.icon, active && styles.iconActive]}>
                  <Ionicons name={active ? 'flash' : 'flash-outline'} size={17}
                    color={active ? Colors.white : Colors.textSecondary} />
                </View>
                <View style={styles.info}>
                  <Text style={[styles.label, active && styles.labelActive]}>{item.label}</Text>
                  <Text style={styles.desc}>{item.desc}</Text>
                </View>
                {active && <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />}
              </TouchableOpacity>
            );
          }}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop:    { flex:1, backgroundColor:'rgba(0,0,0,0.55)' },
  sheet:       { backgroundColor:Colors.surface, borderTopLeftRadius:24, borderTopRightRadius:24,
                 paddingHorizontal:S.lg, paddingTop:S.md, maxHeight:'65%',
                 borderTopWidth:1, borderColor:Colors.border },
  handle:      { width:36, height:4, backgroundColor:Colors.border, borderRadius:R.full,
                 alignSelf:'center', marginBottom:S.lg },
  title:       { fontSize:F.xl, fontWeight:'700', color:Colors.text, marginBottom:2 },
  sub:         { fontSize:F.sm, color:Colors.textSecondary, marginBottom:S.lg },
  card:        { flexDirection:'row', alignItems:'center', backgroundColor:Colors.surfaceHigh,
                 borderRadius:R.md, padding:S.md, marginBottom:S.sm, borderWidth:1, borderColor:Colors.border },
  cardActive:  { borderColor:Colors.primary, backgroundColor:'#1a1a2e' },
  icon:        { width:38, height:38, borderRadius:R.sm, backgroundColor:Colors.surface,
                 alignItems:'center', justifyContent:'center', marginRight:S.md,
                 borderWidth:1, borderColor:Colors.border },
  iconActive:  { backgroundColor:Colors.primary, borderColor:Colors.primaryLight },
  info:        { flex:1 },
  label:       { fontSize:F.md, fontWeight:'600', color:Colors.text },
  labelActive: { color:Colors.white },
  desc:        { fontSize:F.xs, color:Colors.textSecondary, marginTop:2 },
});