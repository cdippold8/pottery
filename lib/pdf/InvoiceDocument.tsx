import { Document, Page, View, Text, Image } from "@react-pdf/renderer";
import { styles } from "./styles";

export type InvoiceItem = {
  name: string;
  imageUrl: string | null;
  costWholesale: number | null;
  costRetail: number | null;
};

export default function InvoiceDocument({
  requestId,
  createdAt,
  customerName,
  customerEmail,
  customerPhone,
  shippingAddress,
  items,
}: {
  requestId: string;
  createdAt: Date;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  shippingAddress: string[];
  items: InvoiceItem[];
}) {
  const wholesaleTotal = items.reduce((sum, i) => sum + (i.costWholesale ?? 0), 0);
  const retailTotal = items.reduce((sum, i) => sum + (i.costRetail ?? 0), 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Invoice</Text>
        <Text style={styles.subtitle}>
          Request #{requestId.slice(-8)} · {createdAt.toLocaleDateString()}
        </Text>

        <View style={styles.row}>
          <View style={styles.box}>
            <Text style={styles.boxTitle}>Bill to</Text>
            <Text>{customerName}</Text>
            <Text>{customerEmail}</Text>
            {customerPhone && <Text>{customerPhone}</Text>}
          </View>
          <View style={styles.box}>
            <Text style={styles.boxTitle}>Ship to</Text>
            {shippingAddress.map((line, i) => (
              <Text key={i}>{line}</Text>
            ))}
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colImage} />
            <Text style={styles.colName}>Item</Text>
            <Text style={styles.colPrice}>Wholesale</Text>
            <Text style={styles.colPrice}>Retail</Text>
          </View>
          {items.map((item, i) => (
            <View key={i} style={styles.tableRow}>
              <View style={styles.colImage}>
                {/* eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer's Image is a PDF primitive, not an HTML img */}
                {item.imageUrl && <Image src={item.imageUrl} style={styles.thumbnail} />}
              </View>
              <Text style={styles.colName}>{item.name}</Text>
              <Text style={styles.colPrice}>
                {item.costWholesale != null ? `$${item.costWholesale.toFixed(2)}` : "—"}
              </Text>
              <Text style={styles.colPrice}>{item.costRetail != null ? `$${item.costRetail.toFixed(2)}` : "—"}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalsRow}>
          <Text>Wholesale total: ${wholesaleTotal.toFixed(2)}</Text>
          <Text>Retail total: ${retailTotal.toFixed(2)}</Text>
        </View>

        <Text style={styles.footer}>Thank you for supporting handmade pottery.</Text>
      </Page>
    </Document>
  );
}
