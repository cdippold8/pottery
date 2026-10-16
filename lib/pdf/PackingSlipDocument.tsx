import { Document, Page, View, Text, Image } from "@react-pdf/renderer";
import { styles } from "./styles";

export type PackingSlipItem = {
  name: string;
  imageUrl: string | null;
  detail: string | null;
};

export default function PackingSlipDocument({
  requestId,
  createdAt,
  customerName,
  shippingAddress,
  items,
}: {
  requestId: string;
  createdAt: Date;
  customerName: string;
  shippingAddress: string[];
  items: PackingSlipItem[];
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Packing Slip</Text>
        <Text style={styles.subtitle}>
          Request #{requestId.slice(-8)} · {createdAt.toLocaleDateString()}
        </Text>

        <View style={{ marginBottom: 24 }}>
          <Text style={styles.boxTitle}>Ship to</Text>
          <Text style={{ fontSize: 14, marginBottom: 2 }}>{customerName}</Text>
          {shippingAddress.map((line, i) => (
            <Text key={i} style={{ fontSize: 12 }}>
              {line}
            </Text>
          ))}
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colImage} />
            <Text style={styles.colName}>Item</Text>
          </View>
          {items.map((item, i) => (
            <View key={i} style={styles.tableRow}>
              <View style={styles.colImage}>
                {/* eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer's Image is a PDF primitive, not an HTML img */}
                {item.imageUrl && <Image src={item.imageUrl} style={styles.thumbnail} />}
              </View>
              <View style={styles.colName}>
                <Text>{item.name}</Text>
                {item.detail && <Text style={{ fontSize: 8, color: "#666", marginTop: 2 }}>{item.detail}</Text>}
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.footer}>Thank you for supporting handmade pottery.</Text>
      </Page>
    </Document>
  );
}
