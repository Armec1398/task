import { useState } from 'react';
import { View, Text, TouchableWithoutFeedback, PanResponder } from 'react-native';
import Svg, { Circle, Line, Text as SvgText } from 'react-native-svg';
import { COLORS } from '../lib/theme';

const SIZE = 240;
const R = SIZE / 2;
const CENTER = R;

export default function ClockPicker({ hour, minute, onChange }: { hour: number; minute: number; onChange: (h: number, m: number) => void }) {
  const [mode, setMode] = useState<'hour' | 'minute'>('hour');

  const getAngle = (x: number, y: number): number => {
    const dx = x - CENTER;
    const dy = y - CENTER;
    let angle = Math.atan2(dy, dx) * 180 / Math.PI; // -180..180, 0 = right
    angle = angle + 90; // rotate so 0 = top
    if (angle < 0) angle += 360;
    return angle;
  };

  const handlePress = (evt: any) => {
    const { locationX, locationY } = evt.nativeEvent || evt;
    const angle = getAngle(locationX, locationY);
    if (mode === 'hour') {
      let h = Math.round(angle / 30) % 12;
      if (h === 0) h = 12;
      const isPM = hour >= 12;
      let h24 = h % 12;
      if (isPM) h24 += 12;
      onChange(h24, minute);
    } else {
      let m = Math.round(angle / 6) % 60;
      onChange(hour, m);
    }
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: handlePress,
    onPanResponderMove: handlePress,
  });

  const selAngle = mode === 'hour' ? ((hour % 12) * 30) : (minute * 6);
  const handLen = mode === 'hour' ? R - 50 : R - 28;
  const handRad = (selAngle - 90) * Math.PI / 180;
  const handX = CENTER + handLen * Math.cos(handRad);
  const handY = CENTER + handLen * Math.sin(handRad);

  return (
    <View style={{ alignItems: 'center', gap: 14 }}>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <TouchableWithoutFeedback onPress={() => setMode('hour')}>
          <View style={{ paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, backgroundColor: mode === 'hour' ? COLORS.primary : COLORS.surfaceAlt }}>
            <Text style={{ fontSize: 20, fontWeight: '700', color: mode === 'hour' ? '#fff' : COLORS.text }}>{String(hour).padStart(2, '0')}</Text>
          </View>
        </TouchableWithoutFeedback>
        <Text style={{ fontSize: 22, fontWeight: '700', color: COLORS.text }}>:</Text>
        <TouchableWithoutFeedback onPress={() => setMode('minute')}>
          <View style={{ paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, backgroundColor: mode === 'minute' ? COLORS.primary : COLORS.surfaceAlt }}>
            <Text style={{ fontSize: 20, fontWeight: '700', color: mode === 'minute' ? '#fff' : COLORS.text }}>{String(minute).padStart(2, '0')}</Text>
          </View>
        </TouchableWithoutFeedback>
      </View>

      <View style={{ width: SIZE, height: SIZE }} {...panResponder.panHandlers}>
        <Svg width={SIZE} height={SIZE}>
          <Circle cx={CENTER} cy={CENTER} r={R} fill={COLORS.surfaceAlt} stroke={COLORS.border} strokeWidth={1} />
          {Array.from({ length: 12 }).map((_, i) => {
            const n = i === 0 ? 12 : i;
            const rad = (n * 30 - 90) * Math.PI / 180;
            const nx = CENTER + (R - 20) * Math.cos(rad);
            const ny = CENTER + (R - 20) * Math.sin(rad);
            const isSel = mode === 'hour' && (hour % 12) === n % 12;
            return (
              <SvgText
                key={i}
                x={nx} y={ny + 5}
                fontSize={14}
                fontWeight={isSel ? '700' : '500'}
                fill={isSel ? COLORS.primary : COLORS.textMuted}
                textAnchor="middle"
              >{n}</SvgText>
            );
          })}
          {/* minute ticks */}
          {mode === 'minute' && Array.from({ length: 60 }).map((_, i) => {
            if (i % 5 === 0) return null;
            const rad = (i * 6 - 90) * Math.PI / 180;
            const isSel = i === minute;
            return (
              <Circle
                key={`t${i}`}
                cx={CENTER + (R - 14) * Math.cos(rad)}
                cy={CENTER + (R - 14) * Math.sin(rad)}
                r={isSel ? 4 : 1.5}
                fill={isSel ? COLORS.primary : COLORS.textMuted}
              />
            );
          })}
          {/* hand line */}
          <Line
            x1={CENTER} y1={CENTER}
            x2={handX} y2={handY}
            stroke={COLORS.primary}
            strokeWidth={mode === 'hour' ? 3 : 2}
            strokeLinecap="round"
          />
          {/* center dot */}
          <Circle cx={CENTER} cy={CENTER} r={5} fill={COLORS.primary} />
          {/* hand end dot */}
          <Circle cx={handX} cy={handY} r={7} fill={COLORS.primary} />
        </Svg>
      </View>
    </View>
  );
}
