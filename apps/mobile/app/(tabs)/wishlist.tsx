import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import Screen from '@/components/Screen';
import { Body, Button, Card, Heading, Notice } from '@/components/ui';
import { EmptyState, LoadingState } from '@/components/States';
import { useWishlist } from '@/lib/wishlist';
import { useTheme } from '@/lib/theme';

export default function Wishlist() {
  const t = useTheme(); const { ids, ready, clear } = useWishlist();
  if (!ready) return <LoadingState label="Loading wishlist…" />;
  return (
    <Screen>
      <Heading>Your wishlist</Heading>
      {ids.length === 0 ? <EmptyState title="Nothing saved yet" message="Tap the heart on any listing to save it here. Saved items stay on this device."><Button label="Browse categories" onPress={() => router.push('/categories')} /></EmptyState> : (
        <>
          <Notice>Saved on this device only. Listing details can’t be loaded until the marketplace service is connected; your saved items are kept.</Notice>
          <View style={{ gap: 8 }}>{ids.map((id) => (
            <Pressable key={id} accessibilityRole="link" accessibilityLabel={`Open saved listing ${id.slice(0, 8)}`} onPress={() => router.push({ pathname: '/product/[id]', params: { id } })}>
              <Card><Text style={{ color: t.text }}>Listing {id.slice(0, 8)}…</Text></Card></Pressable>))}</View>
          <View style={{ height: 16 }} /><Button label="Clear wishlist" variant="outline" onPress={clear} />
        </>
      )}
      <Body muted> </Body>
    </Screen>
  );
}
