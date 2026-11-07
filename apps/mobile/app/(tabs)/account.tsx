import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { FEATURES } from '@nexuse/catalog';
import Screen from '@/components/Screen';
import { Body, Button, Card, Heading, Notice } from '@/components/ui';
import { useTheme } from '@/lib/theme';

const ITEMS = [['Profile', 'Name, city and institution'], ['My listings', 'Items you are selling'], ['Messages', 'Chats with buyers and sellers'], ['Orders', 'Purchases and sales']] as const;
export default function Account() {
  const t = useTheme();
  return (
    <Screen>
      <Heading>Your account</Heading>
      {!FEATURES.accountSignIn && <Notice><Text style={{ fontWeight: '800' }}>Sign-in isn’t available yet.</Text> We’ll add phone-number sign-in with SMS verification once the verification service is connected and tested. Until then there is no account to create.</Notice>}
      <View style={{ gap: 8 }}>
        {ITEMS.map(([title, desc]) => (
          <Card key={title} style={{ opacity: 0.6 }}><View accessible accessibilityState={{ disabled: true }} accessibilityLabel={`${title}. ${desc}. Coming soon.`}>
            <Text style={{ color: t.text, fontWeight: '700' }}>{title} · Coming soon</Text><Body muted>{desc}</Body></View></Card>))}
      </View>
      <View style={{ height: 16 }} />
      <Button label="Open wishlist" variant="outline" onPress={() => router.push('/wishlist')} />
    </Screen>
  );
}
