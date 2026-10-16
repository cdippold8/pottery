import { StyleSheet } from "@react-pdf/renderer";

export const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: "Helvetica", color: "#111" },
  title: { fontSize: 20, marginBottom: 4 },
  subtitle: { fontSize: 10, color: "#666", marginBottom: 20 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  box: { width: "48%" },
  boxTitle: { fontSize: 10, fontWeight: 700, marginBottom: 4, textTransform: "uppercase", color: "#666" },
  table: { marginTop: 8 },
  tableHeader: {
    flexDirection: "row",
    borderBottom: "1pt solid #ccc",
    paddingBottom: 4,
    marginBottom: 4,
    fontWeight: 700,
    color: "#666",
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    borderBottom: "1pt solid #eee",
    paddingVertical: 8,
  },
  colImage: { width: 44 },
  colName: { flex: 1, paddingRight: 8 },
  colPrice: { width: 70, textAlign: "right" },
  thumbnail: { width: 32, height: 32, objectFit: "cover", borderRadius: 2 },
  totalsRow: { flexDirection: "row", justifyContent: "flex-end", gap: 24, marginTop: 16 },
  footer: { marginTop: 32, fontSize: 9, color: "#999" },
});
