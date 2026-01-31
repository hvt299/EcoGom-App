import React from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { X, Calendar, Clock } from 'lucide-react-native';
import { Schedule } from '../types/schedule';

interface Props {
    visible: boolean;
    onClose: () => void;
    schedule: Schedule | null;
}

export default function ScheduleDetailModal({ visible, onClose, schedule }: Props) {
    if (!schedule) return null;

    const getDayName = (day: number) => ["CN", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"][day];

    const sortedSchedule = [...schedule.standard_schedule].sort((a, b) => {
        const dayA = a.day_of_week === 0 ? 7 : a.day_of_week;
        const dayB = b.day_of_week === 0 ? 7 : b.day_of_week;
        return dayA - dayB;
    });

    return (
        <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
            <View style={styles.centeredView}>
                <View style={styles.modalView}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.headerTitle}>Lịch thu gom định kỳ</Text>
                            <Text style={styles.headerSubtitle}>{schedule.village_name} - {schedule.ward}</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <X color="white" size={24} />
                        </TouchableOpacity>
                    </View>

                    {/* Body */}
                    <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
                        {sortedSchedule.length === 0 ? (
                            <Text style={styles.emptyText}>Chưa có lịch định kỳ.</Text>
                        ) : (
                            sortedSchedule.map((item, idx) => (
                                <View key={idx} style={styles.itemRow}>
                                    <View style={styles.dayBadge}>
                                        <Text style={styles.dayText}>{getDayName(item.day_of_week)}</Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.wasteType}>{item.waste_type}</Text>
                                        <View style={styles.timeRow}>
                                            <Clock size={12} color="#64748b" />
                                            <Text style={styles.timeText}> {item.time_slot}</Text>
                                        </View>
                                    </View>
                                </View>
                            ))
                        )}

                        <View style={styles.noteBox}>
                            <Text style={styles.noteText}>*Lưu ý: Lịch có thể thay đổi vào các dịp Lễ/Tết. Vui lòng theo dõi thông báo.</Text>
                        </View>
                    </ScrollView>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                            <Text style={styles.closeButtonText}>Đóng</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    centeredView: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 20 },
    modalView: { backgroundColor: 'white', borderRadius: 20, overflow: 'hidden', maxHeight: '60%', width: '100%' },
    header: { backgroundColor: '#16a34a', padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerTitle: { color: 'white', fontWeight: 'bold', fontSize: 18 },
    headerSubtitle: { color: 'rgba(255,255,255,0.9)', fontSize: 13 },
    closeBtn: { padding: 4 },
    body: { padding: 16, flexGrow: 1 },
    itemRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', padding: 12, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0' },
    dayBadge: { backgroundColor: '#dcfce7', width: 50, height: 50, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    dayText: { color: '#15803d', fontWeight: 'bold', fontSize: 12, textAlign: 'center' },
    wasteType: { fontSize: 16, fontWeight: 'bold', color: '#334155' },
    timeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    timeText: { fontSize: 12, color: '#64748b' },
    noteBox: { backgroundColor: '#fff7ed', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#ffedd5', marginTop: 10 },
    noteText: { color: '#c2410c', fontSize: 12, fontStyle: 'italic' },
    emptyText: { textAlign: 'center', color: '#94a3b8', marginTop: 20 },
    footer: { padding: 16, borderTopWidth: 1, borderTopColor: '#e2e8f0', backgroundColor: '#f8fafc' },
    closeButton: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#cbd5e1', padding: 12, borderRadius: 10, alignItems: 'center' },
    closeButtonText: { color: '#475569', fontWeight: 'bold' }
});