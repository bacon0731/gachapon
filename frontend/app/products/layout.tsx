'use client';

import { AdminProvider } from '@/contexts/AdminContext';
import { ProductProvider } from '@/contexts/ProductContext';
import { ShipmentProvider } from '@/contexts/ShipmentContext';
import { LogProvider } from '@/contexts/LogContext';

export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminProvider>
      <ProductProvider>
        <ShipmentProvider>
          <LogProvider>
            {children}
          </LogProvider>
        </ShipmentProvider>
      </ProductProvider>
    </AdminProvider>
  );
}
