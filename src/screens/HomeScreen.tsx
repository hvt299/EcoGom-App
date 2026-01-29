import React, { useEffect, useState, useCallback } from 'react';
import {
    StyleSheet, Text, View, TextInput, FlatList,
    ActivityIndicator, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { Search, Truck, AlertTriangle, Leaf, Clock, MapPin } from 'lucide-react-native';
import { wasteApi } from '../services/api';
import { Waste, ScheduleResponse, Location } from '../types/waste';

export default function HomeScreen() {
    const [keyword, setKeyword] = useState('');
    const [wastes, setWastes] = useState<Waste[]>([]);
    const [schedule, setSchedule] = useState<ScheduleResponse | null>(null);
    const [locations, setLocations] = useState<Location[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const fetchAllData = async () => {
        const scheduleData = await wasteApi.getTodaySchedule('Thôn Đông');
        setSchedule(scheduleData);

        const locationData = await wasteApi.getLocations();
        setLocations(locationData);

        if (keyword) {
            const wasteData = await wasteApi.getAll(keyword);
            setWastes(wasteData);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, []);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchAllData();
        setRefreshing(false);
    }, [keyword]);

    useEffect(() => {
        const timer = setTimeout(async () => {
            setLoading(true);
            const data = await wasteApi.getAll(keyword);
            setWastes(data);
            setLoading(false);
        }, 500);
        return () => clearTimeout(timer);
    }, [keyword]);

    const renderScheduleCard = () => {
        if (!schedule) return null;

        const isSpecial = schedule.type === 'SPECIAL';
        const hasTruck = !schedule.is_cancelled && schedule.type !== 'NONE';

        let bgStyle, borderStyle, textStyle, iconBg;

        if (isSpecial) {
            bgStyle = '#fff7ed'; borderStyle = '#ffedd5'; textStyle = '#9a3412'; iconBg = '#ffedd5';
        } else if (hasTruck) {
            bgStyle = '#eff6ff'; borderStyle = '#dbeafe'; textStyle = '#1e40af'; iconBg = '#dbeafe';
        } else {
            bgStyle = '#f1f5f9'; borderStyle = '#e2e8f0'; textStyle = '#475569'; iconBg = '#e2e8f0';
        }

        return (
            <View style={[styles.card, { backgroundColor: bgStyle, borderColor: borderStyle }]}>
                <View style={styles.cardRow}>
                    {/* Icon */}
                    <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
                        {isSpecial ?
                            <AlertTriangle color={textStyle} size={20} /> :
                            <Truck color={textStyle} size={20} />
                        }
                    </View>

                    {/* Nội dung chính */}
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.cardTitle, { color: textStyle }]}>
                            {schedule.message}
                        </Text>

                        {/* Chỉ hiện giờ nếu có xe */}
                        {hasTruck && (
                            <View style={styles.timeContainer}>
                                <View style={styles.timeBadge}>
                                    <Clock size={14} color={textStyle} style={{ marginRight: 4 }} />
                                    <Text style={{ color: textStyle, fontWeight: '500', fontSize: 13 }}>
                                        {schedule.time}
                                    </Text>
                                </View>
                                <View style={styles.typeBadge}>
                                    <Text style={{ color: textStyle, fontSize: 12 }}>
                                        Thu gom: {schedule.waste_type}
                                    </Text>
                                </View>
                            </View>
                        )}

                        {/* Ghi chú (Note) */}
                        {schedule.note && (
                            <Text style={[styles.noteText, { color: textStyle }]}>
                                *Lưu ý: {schedule.note}
                            </Text>
                        )}
                    </View>
                </View>
            </View>
        );
    };

    // --- HEADER CỦA LIST (Chứa Lịch, Map, Search) ---
    const renderHeader = () => (
        <View>
            {/* 1. Tiêu đề Lịch */}
            <View style={styles.sectionHeader}>
                <Clock size={16} color="#64748b" />
                <Text style={styles.sectionTitle}>Lịch thu gom hôm nay (Thôn Đông):</Text>
            </View>
            {renderScheduleCard()}

            {/* 2. Bản đồ */}
            <View style={styles.sectionHeader}>
                <MapPin size={16} color="#ef4444" />
                <Text style={styles.sectionTitle}>Điểm thu gom gần bạn:</Text>
            </View>
            <View style={styles.mapContainer}>
                <MapView
                    style={styles.map}
                    provider={PROVIDER_DEFAULT}
                    initialRegion={{
                        latitude: 21.028511,
                        longitude: 105.854444,
                        latitudeDelta: 0.05,
                        longitudeDelta: 0.05,
                    }}
                >
                    {locations.map((loc) => (
                        <Marker
                            key={loc._id}
                            coordinate={{
                                latitude: loc.location.coordinates[1], // MongoDB là [Long, Lat] nên phải đảo
                                longitude: loc.location.coordinates[0],
                            }}
                            title={loc.name}
                            description={loc.address_hint}
                        />
                    ))}
                </MapView>
            </View>

            {/* 3. Ô tìm kiếm */}
            <View style={styles.searchSticky}>
                <View style={styles.searchContainer}>
                    <Search color="#9ca3af" size={20} style={{ marginRight: 10 }} />
                    <TextInput
                        style={styles.input}
                        placeholder="Bạn muốn vứt gì? (VD: vỏ lon, giấy...)"
                        value={keyword}
                        onChangeText={setKeyword}
                    />
                    {loading && <ActivityIndicator size="small" color="#16a34a" />}
                </View>
            </View>
        </View>
    );

    // --- ITEM RÁC ---
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
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            {/* Header App */}
            <View style={styles.header}>
                <View style={styles.logoContainer}>
                    <Leaf color="white" size={20} />
                </View>
                <Text style={styles.headerTitle}>EcoGom Mobile</Text>
            </View>

            {/* Main Content */}
            <FlatList
                data={wastes}
                keyExtractor={(item) => item._id}
                renderItem={renderWasteItem}
                ListHeaderComponent={renderHeader}
                contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#16a34a']} />
                }
                ListEmptyComponent={
                    !loading && keyword ? (
                        <Text style={styles.emptyText}>Không tìm thấy kết quả</Text>
                    ) : null
                }
            />
        </SafeAreaView>
    );
}

// STYLES
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        padding: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0'
    },
    logoContainer: { backgroundColor: '#16a34a', padding: 6, borderRadius: 20, marginRight: 8 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#166534' },

    // Section Header
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, marginTop: 8 },
    sectionTitle: { fontSize: 14, color: '#64748b', fontWeight: '600', marginLeft: 6 },

    // Card Style (Lịch)
    card: { padding: 16, borderRadius: 12, marginBottom: 16, borderWidth: 1 },
    cardRow: { flexDirection: 'row', alignItems: 'flex-start' },
    iconContainer: { padding: 8, borderRadius: 50, marginRight: 12 },
    cardTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
    timeContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 6, flexWrap: 'wrap' },
    timeBadge: { flexDirection: 'row', alignItems: 'center', marginRight: 12 },
    typeBadge: { backgroundColor: 'rgba(255,255,255,0.6)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    noteText: { fontSize: 13, fontStyle: 'italic', marginTop: 6, opacity: 0.8 },

    // Map Style
    mapContainer: { height: 200, borderRadius: 12, overflow: 'hidden', marginBottom: 20, borderWidth: 1, borderColor: '#e2e8f0' },
    map: { width: '100%', height: '100%' },

    // Search Style
    searchSticky: { backgroundColor: '#f8fafc', paddingBottom: 2 },
    searchContainer: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
        padding: 12, borderRadius: 12, marginBottom: 16,
        shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2, borderWidth: 1, borderColor: '#e2e8f0'
    },
    input: { flex: 1, fontSize: 16 },

    // List Item Style
    wasteItem: {
        backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 10,
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 3, elevation: 1
    },
    wasteName: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
    wasteLocal: { fontSize: 12, color: '#64748b', marginTop: 2 },
    wasteCategory: {
        fontSize: 10, fontWeight: 'bold', color: '#15803d',
        backgroundColor: '#dcfce7', paddingHorizontal: 8, paddingVertical: 2,
        borderRadius: 10, overflow: 'hidden', marginBottom: 4
    },
    wastePrice: { fontSize: 14, fontWeight: 'bold', color: '#16a34a' },
    emptyText: { textAlign: 'center', color: '#94a3b8', marginTop: 20 },
});