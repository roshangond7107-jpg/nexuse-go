import type { Metadata } from 'next';
import SellForm from '@/components/SellForm';
export const metadata: Metadata = { title: 'Sell an item' };
export default function Sell() { return (<><h1>Sell a study item</h1><SellForm /></>); }
