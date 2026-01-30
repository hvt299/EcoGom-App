import React, { useEffect, useState, useCallback } from 'react';
import {
    StyleSheet, Text, View, TextInput, FlatList,
    ActivityIndicator, RefreshControl, TouchableOpacity, Modal
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Truck, AlertTriangle, Leaf, Clock, MapPin, ChevronDown, Bell, Info, Check } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as LocationExpo from 'expo-location';

import LeafletMap from '../components/LeafletMap';
import ScheduleDetailModal from '../components/ScheduleDetailModal';
import { wasteApi, scheduleApi, locationApi } from '../services/api';
import { Waste } from '../types/waste';
import { ScheduleResponse, Schedule, SpecialEvent } from '../types/schedule';
import { Location } from '../types/location';
import { processScheduleData } from '../utils/dataProcessor';

export default function HomeScreen() {
    const [keyword, setKeyword] = useState('');
    const [wastes, setWastes] = useState<Waste[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const [userLocation, setUserLocation] = useState<[number, number]>([21.028511, 105.854444]);
    const [selectedVillage, setSelectedVillage] = useState<string>("");
    const [showVillagePicker, setShowVillagePicker] = useState(false);
    const [groupedVillages, setGroupedVillages] = useState<Record<string, string[]>>({});
    const [wards, setWards] = useState<string[]>([]);
    const [activeWardTab, setActiveWardTab] = useState<string>("");

    const [todaySchedule, setTodaySchedule] = useState<ScheduleResponse | null>(null);
    const [fullSchedule, setFullSchedule] = useState<Schedule | null>(null);
    const [upcomingEvents, setUpcomingEvents] = useState<SpecialEvent[]>([]);
    const [showDetailModal, setShowDetailModal] = useState(false);

    useEffect(() => {
        const initData = async () => {
            const allSchedules = await scheduleApi.getAll();
            if (allSchedules && allSchedules.length > 0) {
                const { groupedVillages, wards, defaultWard, defaultVillage } = processScheduleData(allSchedules);
                
                setGroupedVillages(groupedVillages);
                setWards(wards);

                if (defaultWard) setActiveWardTab(defaultWard);
                if (defaultVillage && !selectedVillage) setSelectedVillage(defaultVillage);
            }
            const locationData = await locationApi.getAll();
            setLocations(locationData);

            let { status } = await LocationExpo.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                let location = await LocationExpo.getCurrentPositionAsync({});
                setUserLocation([location.coords.latitude, location.coords.longitude]);
            }
        };
        initData();
    }, []);

    const fetchScheduleData = async () => {
        if (!selectedVillage) return;
        const todayData = await scheduleApi.getTodaySchedule(selectedVillage);
        setTodaySchedule(todayData);

        const currentFull = await scheduleApi.getFullByVillage(selectedVillage);
        setFullSchedule(currentFull || null);

        if (currentFull && currentFull.special_events) {
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            const future = currentFull.special_events.filter((e: SpecialEvent) => new Date(e.end_date) >= now);
            setUpcomingEvents(future);
        } else {
            setUpcomingEvents([]);
        }
    };

    useEffect(() => { fetchScheduleData(); }, [selectedVillage]);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (keyword) {
                setLoading(true);
                const data = await wasteApi.getAll(keyword);
                setWastes(data);
                setLoading(false);
            } else {
                setWastes([]);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [keyword]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchScheduleData();
        const locationData = await locationApi.getAll();
        setLocations(locationData);
        setRefreshing(false);
    }, [selectedVillage]);

    // --- COMPONENT HEADER (Chứa Dashboard) ---
    const renderHeader = () => (
        <View>
            {/* Thanh Tìm Kiếm (Sticky visual) */}
            <View style={styles.searchContainer}>
                <Search color="#16a34a" size={20} style={{ marginRight: 10 }} />
                <TextInput
                    style={styles.input}
                    placeholder="Tìm rác (VD: pin, vỏ lon...)"
                    placeholderTextColor="#94a3b8"
                    value={keyword}
                    onChangeText={setKeyword}
                />
                {loading && <ActivityIndicator size="small" color="#16a34a" />}
            </View>

            {/* LOGIC HIỂN THỊ: Nếu KHÔNG tìm kiếm thì hiện Dashboard */}
            {!keyword && (
                <>
                    {/* 1. LỊCH HÔM NAY */}
                    <View style={styles.sectionHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Clock size={16} color="#64748b" />
                            <Text style={styles.sectionTitle}>Lịch hôm nay:</Text>
                        </View>
                        <TouchableOpacity onPress={() => setShowDetailModal(true)} style={styles.detailBtn}>
                            <Info size={12} color="#16a34a" />
                            <Text style={styles.detailBtnText}>Chi tiết tuần</Text>
                        </TouchableOpacity>
                    </View>

                    {todaySchedule && (
                        <View style={[styles.card, getCardStyle(todaySchedule).style]}>
                            <View style={styles.cardRow}>
                                <View style={[styles.iconContainer, { backgroundColor: getCardStyle(todaySchedule).iconBg }]}>
                                    {todaySchedule.type === 'SPECIAL' ? <AlertTriangle color={getCardStyle(todaySchedule).text} size={20} /> : <Truck color={getCardStyle(todaySchedule).text} size={20} />}
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.cardTitle, { color: getCardStyle(todaySchedule).text }]}>{todaySchedule.message}</Text>
                                    {todaySchedule.time && (
                                        <View style={styles.timeContainer}>
                                            <Clock size={14} color={getCardStyle(todaySchedule).text} />
                                            <Text style={{ color: getCardStyle(todaySchedule).text, fontSize: 13, marginLeft: 4 }}>{todaySchedule.time} - {todaySchedule.waste_type}</Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        </View>
                    )}

                    {/* 2. SỰ KIỆN SẮP TỚI */}
                    {upcomingEvents.length > 0 && (
                        <View style={{ marginBottom: 20 }}>
                            <View style={styles.sectionHeader}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Bell size={16} color="#f97316" />
                                    <Text style={[styles.sectionTitle]}>Sắp tới:</Text>
                                </View>
                            </View>
                            {upcomingEvents.map((ev, idx) => (
                                <View key={idx} style={styles.eventItem}>
                                    <View>
                                        <Text style={styles.eventTitle}>{ev.name}</Text>
                                        <Text style={styles.eventDate}>
                                            {new Date(ev.start_date).toLocaleDateString('vi-VN')} - {new Date(ev.end_date).toLocaleDateString('vi-VN')}
                                        </Text>
                                    </View>
                                    {ev.is_cancelled && <Text style={styles.tagOff}>NGHỈ</Text>}
                                </View>
                            ))}
                        </View>
                    )}

                    {/* 3. BẢN ĐỒ */}
                    <View style={styles.sectionHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <MapPin size={16} color="#2563eb" />
                            <Text style={[styles.sectionTitle]}>Điểm thu gom gần bạn:</Text>
                        </View>
                    </View>
                    <View style={styles.mapContainer}>
                        <LeafletMap locations={locations} center={userLocation} />
                    </View>
                </>
            )}
        </View>
    );

    // --- ITEM RÁC (Chỉ hiện khi Search) ---
    const renderWasteItem = ({ item }: { item: Waste }) => (
        <View style={styles.wasteItem}>
            <View>
                <Text style={styles.wasteName}>{item.name}</Text>
                <Text style={styles.wasteLocal}>Gọi là: {item.local_names.join(', ')}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.wasteCategory}>{item.category}</Text>
                <Text style={styles.wastePrice}>{item.estimated_price}</Text>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            {/* HEADER GRADIENT */}
            <LinearGradient colors={['#15803d', '#16a34a', '#22c55e']} style={styles.headerGradient}>
                <SafeAreaView edges={['top', 'left', 'right']}>
                    <View style={styles.headerContent}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <View style={styles.logoContainer}><Leaf color="#16a34a" size={18} /></View>
                            <Text style={styles.appName}>EcoGom</Text>
                        </View>

                        {/* Selector đơn giản */}
                        <TouchableOpacity style={styles.villageSelector} onPress={() => setShowVillagePicker(true)}>
                            <Text style={styles.villageText}>{selectedVillage || "Đang tải..."}</Text>
                            <ChevronDown size={16} color="white" />
                        </TouchableOpacity>
                    </View>
                    <View style={{ paddingHorizontal: 16, paddingBottom: 24 }}>
                        <Text style={{ color: '#dcfce7', fontSize: 13 }}>Chào bạn,</Text>
                        <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>Hôm nay bạn muốn vứt bỏ gì nào?</Text>
                    </View>
                </SafeAreaView>
            </LinearGradient>

            {/* MAIN CONTENT */}
            <View style={styles.mainContainer}>
                <FlatList
                    data={keyword ? wastes : []}
                    keyExtractor={(item) => item._id}
                    renderItem={renderWasteItem}
                    ListHeaderComponent={renderHeader}
                    contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#16a34a']} />}
                    ListEmptyComponent={
                        keyword && !loading ? <Text style={styles.emptyText}>Không tìm thấy kết quả</Text> : null
                    }
                />
            </View>

            <Modal
                animationType="slide"
                transparent={true}
                visible={showVillagePicker}
                onRequestClose={() => setShowVillagePicker(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Chọn khu vực</Text>
                            <TouchableOpacity onPress={() => setShowVillagePicker(false)}>
                                <Text style={styles.closeText}>Đóng</Text>
                            </TouchableOpacity>
                        </View>

                        {/* LIST XÃ (Tab Ngang) */}
                        <View style={styles.tabsContainer}>
                            <FlatList
                                data={wards}
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                keyExtractor={(item) => item}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={[
                                            styles.tabItem,
                                            activeWardTab === item && styles.tabItemSelected
                                        ]}
                                        onPress={() => setActiveWardTab(item)}
                                    >
                                        <Text style={[
                                            styles.tabText,
                                            activeWardTab === item && styles.tabTextSelected
                                        ]}>
                                            {item}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            />
                        </View>

                        {/* LIST THÔN (Dọc) */}
                        <View style={styles.listContainer}>
                            <Text style={styles.subHeader}>
                                {activeWardTab ? `Danh sách thôn thuộc ${activeWardTab}:` : 'Đang tải...'}
                            </Text>

                            {(!groupedVillages[activeWardTab] || groupedVillages[activeWardTab].length === 0) ? (
                                <Text style={{ textAlign: 'center', marginTop: 20, color: '#94a3b8' }}>
                                    Không có dữ liệu thôn
                                </Text>
                            ) : (
                                <FlatList
                                    data={groupedVillages[activeWardTab]}
                                    extraData={activeWardTab}
                                    keyExtractor={(item, index) => `${item}-${index}`}
                                    contentContainerStyle={{ paddingBottom: 20 }}
                                    renderItem={({ item }) => (
                                        <TouchableOpacity
                                            style={[
                                                styles.villageItem,
                                                item === selectedVillage && styles.villageItemSelected
                                            ]}
                                            onPress={() => {
                                                setSelectedVillage(item);
                                                setShowVillagePicker(false);
                                            }}
                                        >
                                            <Text style={[
                                                styles.villageItemText,
                                                item === selectedVillage && styles.villageItemTextSelected
                                            ]}>
                                                {item}
                                            </Text>
                                            {item === selectedVillage && <Check size={18} color="#16a34a" />}
                                        </TouchableOpacity>
                                    )}
                                />
                            )}
                        </View>
                    </View>
                </View>
            </Modal>
            <ScheduleDetailModal visible={showDetailModal} onClose={() => setShowDetailModal(false)} schedule={fullSchedule} />
        </View>
    );
}

// Helper Style Card
const getCardStyle = (data: ScheduleResponse) => {
    if (data.type === 'SPECIAL') return { style: { backgroundColor: '#fff7ed', borderColor: '#ffedd5' }, text: '#9a3412', iconBg: '#ffedd5' };
    if (!data.is_cancelled && data.type !== 'NONE') return { style: { backgroundColor: '#eff6ff', borderColor: '#dbeafe' }, text: '#1e40af', iconBg: '#dbeafe' };
    return { style: { backgroundColor: '#f1f5f9', borderColor: '#e2e8f0' }, text: '#475569', iconBg: '#e2e8f0' };
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    headerGradient: { paddingBottom: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
    logoContainer: { backgroundColor: 'white', padding: 6, borderRadius: 12, marginRight: 8 },
    appName: { color: 'white', fontWeight: 'bold', fontSize: 18 },
    villageSelector: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    villageText: { color: 'white', fontWeight: 'bold', marginRight: 4, fontSize: 13 },

    mainContainer: { flex: 1, marginTop: -20 },

    searchContainer: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
        padding: 14, borderRadius: 16, marginBottom: 20,
        shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5
    },
    input: { flex: 1, fontSize: 16 },

    sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, marginTop: 4 },
    sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#475569', marginLeft: 6 },
    detailBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#dcfce7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    detailBtnText: { fontSize: 11, color: '#16a34a', fontWeight: 'bold', marginLeft: 4 },

    card: { padding: 16, borderRadius: 16, marginBottom: 20, borderWidth: 1 },
    cardRow: { flexDirection: 'row', alignItems: 'center' },
    iconContainer: { padding: 10, borderRadius: 50, marginRight: 12 },
    cardTitle: { fontSize: 16, fontWeight: 'bold' },
    timeContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },

    eventItem: { backgroundColor: 'white', padding: 12, borderRadius: 12, borderLeftWidth: 4, borderLeftColor: '#f97316', marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 2, elevation: 1 },
    eventTitle: { fontWeight: 'bold', color: '#1e293b' },
    eventDate: { fontSize: 12, color: '#64748b' },
    tagOff: { backgroundColor: '#fee2e2', color: '#dc2626', fontSize: 10, fontWeight: 'bold', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },

    mapContainer: { height: 200, borderRadius: 16, overflow: 'hidden', marginBottom: 20, borderWidth: 2, borderColor: 'white', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, elevation: 3 },

    wasteItem: { backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 3, elevation: 1 },
    wasteName: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
    wasteLocal: { fontSize: 12, color: '#64748b', marginTop: 2 },
    wasteCategory: { fontSize: 10, fontWeight: 'bold', color: '#15803d', backgroundColor: '#dcfce7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, overflow: 'hidden', marginBottom: 4 },
    wastePrice: { fontSize: 14, fontWeight: 'bold', color: '#16a34a' },
    emptyText: { textAlign: 'center', color: '#94a3b8', marginTop: 20 },

    modalOverlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20
    },
    modalContent: {
        backgroundColor: 'white', borderRadius: 16, padding: 16, height: '60%',
        shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5
    },
    modalHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9'
    },
    modalTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
    closeText: { color: '#64748b', fontWeight: 'bold' },

    tabsContainer: { paddingHorizontal: 12, marginBottom: 16, maxHeight: 50 },
    tabItem: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f1f5f9', marginRight: 8, borderWidth: 1, borderColor: '#e2e8f0' },
    tabItemSelected: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
    tabText: { fontSize: 14, color: '#64748b', fontWeight: '600' },
    tabTextSelected: { color: 'white' },

    listContainer: { flex: 1, paddingHorizontal: 10, marginTop: 10, width: '100%' },
    subHeader: { fontSize: 13, color: '#94a3b8', marginBottom: 10, fontWeight: 'bold', textTransform: 'uppercase' },
    villageItem: {
        flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: '#f8fafc'
    },
    villageItemSelected: { backgroundColor: '#f0fdf4', borderRadius: 8 },
    villageItemText: { fontSize: 15, color: '#334155' },
    villageItemTextSelected: { color: '#16a34a', fontWeight: 'bold' },

    sectionHeaderContainer: {
        backgroundColor: '#f1f5f9',
        paddingVertical: 8,
        paddingHorizontal: 12,
        marginTop: 10,
        borderRadius: 8
    },
    sectionHeaderText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#475569',
        textTransform: 'uppercase'
    },
});