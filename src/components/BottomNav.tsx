import { TouchableOpacity, Text, View } from 'react-native';
import { useArmakStore, type TabType } from '../lib/store';
import { CheckSquare, CalendarDays, BarChart3, Settings } from 'lucide-react-native';
import { COLORS } from '../lib/theme';

const tabs: { id: TabType; label: string; icon: any }[] = [
  { id: 'tasks', label: 'تسک‌ها', icon: CheckSquare },
  { id: 'calendar', label: 'تقویم', icon: CalendarDays },
  { id: 'reports', label: 'گزارش', icon: BarChart3 },
  { id: 'settings', label: 'تنظیمات', icon: Settings },
];

export default function BottomNav() {
  const { activeTab, setActiveTab } = useArmakStore();

  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: '#ffffffee',
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        paddingBottom: 8,
      }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;
        return (
          <TouchableOpacity
            key={tab.id}
            onPress={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 8,
            }}
          >
            <Icon size={22} color={isActive ? COLORS.primary : COLORS.textMuted} />
            <Text
              style={{
                fontSize: 11,
                marginTop: 2,
                color: isActive ? COLORS.primary : COLORS.textMuted,
                fontWeight: isActive ? '700' : '500',
              }}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
