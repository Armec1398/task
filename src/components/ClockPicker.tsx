import { View, Text, TouchableWithoutFeedback, Dimensions } from 'react-native';
import { useState } from 'react';
import { COLORS } from '../lib/theme';

const SIZE = 220;
const R = SIZE / 2;
const CENTER = R;

export default function ClockPicker({ hour, minute, onChange }: { hour: number; minute: number; onChange: (h: number, m: number) => void }) {
  const [mode, setMode] = useState<'hour' | 'minute'>('hour');

  const onPick = (e: any) => {
    const { locationX, locationY } = e.nativeEvent;
    const dx = locationX - CENTER;
    const dy = locationY - CENTER;
    let angle = Math.atan2(dy, dx) * 180 / Math.PI; // -180..180, 0 = راست
    // توی ساعت 0 درجه بالاست؛ بچرخونیم
    angle = angle + 90;
    if (angle < 0) angle += 360;
    if (mode === 'hour') {
      let h = Math.round(angle / 30) % 12;
      if (h === 0) h = 12;
      // حفظ AM/PM بر اساس مقدار قبلی
      const isPM = hour >= 12;
      let h24 = h % 12;
      if (isPM) h24 += 12;
      onChange(h24, minute);
    } else {
      let m = Math.round(angle / 6) % 60;
      if (m < 0) m += 60;
      onChange(hour, m);
    }
  };

  const curAngle = mode === 'hour'
    ? ((hour % 12) * 30) - 90
    : (minute * 6) - 90;
  const rad = (curAngle) * Math.PI / 180;
  const handLen = mode === 'hour' ? R - 50 : R - 28;
  const handX = CENTER + handLen * Math.cos(rad);
  const handY = CENTER + handLen * Math.sin(rad);

  return (
    <View style={{ alignItems: 'center', gap: 12 }}>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <TouchableWithoutFeedback onPress={() => setMode('hour')}>
          <View style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, backgroundColor: mode === 'hour' ? COLORS.primary : COLORS.surfaceAlt }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: mode === 'hour' ? '#fff' : COLORS.text }}>{String(hour).padStart(2, '0')}</Text>
          </View>
        </TouchableWithoutFeedback>
        <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.text }}>:</Text>
        <TouchableWithoutFeedback onPress={() => setMode('minute')}>
          <View style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, backgroundColor: mode === 'minute' ? COLORS.primary : COLORS.surfaceAlt }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: mode === 'minute' ? '#fff' : COLORS.text }}>{String(minute).padStart(2, '0')}</Text>
          </View>
        </TouchableWithoutFeedback>
      </View>

      <TouchableWithoutFeedback onPress={onPick}>
        <View style={{ width: SIZE, height: SIZE, borderRadius: SIZE / 2, backgroundColor: COLORS.surfaceAlt, borderWidth: 1, borderColor: COLORS.border, position: 'relative' }}>
          {Array.from({ length: 12 }).map((_, i) => {
            const a = i * 30 * Math.PI / 180;
            const numX = CENTER + (R - 16) * Math.sin(a) - 8;
            const numY = CENTER - (R - 16) * Math.cos(a) - 10;
            const n = i === 0 ? 12 : i;
            return (
              <Text key={i} style={{ position: 'absolute', left: numX, top: numY, fontSize: 13, color: COLORS.textMuted, fontWeight: '600' }}>{n}</Text>
            );
          })}
          {/* عقربه */}
          <View style={{ position: 'absolute', left: CENTER - 2, top: CENTER - 2, width: 4, height: 4, borderRadius: 2, backgroundColor: COLORS.primary }} />
          <View style={{ position: 'absolute', left: Math.min(CENTER, handX) - 2, top: Math.min(CENTER, handY) - 2, width: Math.abs(handX - CENTER) + 4, height: Math.abs(handY - CENTER) + 4, justifyContent: 'center' }}>
            <View style={{ height: 3, backgroundColor: COLORS.primary, borderRadius: 2, transform: [{ rotate: `${curAngle + 90}deg` }] }} />
          </View>
          <View style={{ position: 'absolute', left: handX - 7, top: handY - 7, width: 14, height: 14, borderRadius: 7, backgroundColor: COLORS.primary }} />
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
}
