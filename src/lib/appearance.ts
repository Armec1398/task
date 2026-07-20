import { useEffect } from 'react';
import { I18nManager, StyleSheet } from 'react-native';
import * as Font from 'expo-font';

let loaded = false;

export async function prepareAppearance(): Promise<void> {
  if (loaded) return;
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
  await Font.loadAsync({
    'Vazirmatn': require('../../assets/fonts/Vazirmatn-Regular.ttf'),
    'Vazirmatn-Medium': require('../../assets/fonts/Vazirmatn-Medium.ttf'),
    'Vazirmatn-Bold': require('../../assets/fonts/Vazirmatn-Bold.ttf'),
  });
  loaded = true;
}

export const FONT = {
  regular: 'Vazirmatn',
  medium: 'Vazirmatn-Medium',
  bold: 'Vazirmatn-Bold',
} as const;

export const fontStyle = StyleSheet.create({
  regular: { fontFamily: FONT.regular },
  medium: { fontFamily: FONT.medium },
  bold: { fontFamily: FONT.bold },
});
