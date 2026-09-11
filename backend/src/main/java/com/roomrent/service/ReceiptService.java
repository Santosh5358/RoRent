package com.roomrent.service;

import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;
import com.roomrent.exception.ApiException;
import com.roomrent.model.Bill;
import com.roomrent.model.Property;
import com.roomrent.model.Room;
import com.roomrent.model.Tenant;
import com.roomrent.repository.PropertyRepository;
import com.roomrent.repository.RoomRepository;
import com.roomrent.repository.TenantRepository;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@Service
public class ReceiptService {

    private final BillService billService;
    private final TenantRepository tenantRepository;
    private final RoomRepository roomRepository;
    private final PropertyRepository propertyRepository;

    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("dd MMM yyyy");
    private static final DateTimeFormatter MONTH = DateTimeFormatter.ofPattern("MMMM yyyy");

    public ReceiptService(BillService billService,
                          TenantRepository tenantRepository,
                          RoomRepository roomRepository,
                          PropertyRepository propertyRepository) {
        this.billService = billService;
        this.tenantRepository = tenantRepository;
        this.roomRepository = roomRepository;
        this.propertyRepository = propertyRepository;
    }

    public byte[] generatePdf(Long ownerId, Long billId) {
        Bill bill = billService.get(ownerId, billId);
        return generatePdfForBill(bill);
    }

    /**
     * Generates a receipt PDF for a bill that has already been authorised for
     * the caller (used by both the owner and the tenant portal).
     */
    public byte[] generatePdfForBill(Bill bill) {
        Tenant tenant = tenantRepository.findById(bill.getTenantId()).orElse(null);
        Room room = roomRepository.findById(bill.getRoomId()).orElse(null);
        Property property = room != null
                ? propertyRepository.findById(room.getPropertyId()).orElse(null) : null;

        String html = buildHtml(bill, tenant, room, property);
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            PdfRendererBuilder builder = new PdfRendererBuilder();
            builder.useFastMode();
            builder.withHtmlContent(html, null);
            builder.toStream(out);
            builder.run();
            return out.toByteArray();
        } catch (Exception e) {
            throw ApiException.badRequest("Failed to generate PDF: " + e.getMessage());
        }
    }

    private String buildHtml(Bill bill, Tenant tenant, Room room, Property property) {
        String tenantName = tenant != null ? tenant.getName() : "-";
        String roomNumber = room != null ? room.getRoomNumber() : "-";
        String propertyName = property != null ? property.getName() : "-";
        String month = bill.getBillingMonth() != null ? bill.getBillingMonth().format(MONTH) : "-";
        String due = bill.getDueDate() != null ? bill.getDueDate().format(DATE) : "-";

        String elecLabel = "Electricity";
        if (bill.getUnitsConsumed() != null && bill.getPricePerUnit() != null) {
            elecLabel = "Electricity (" + trim(bill.getUnitsConsumed()) + " units &#215; Rs. "
                    + trim(bill.getPricePerUnit()) + ")";
        }

        BigDecimal outstanding = billService.outstanding(bill);

        return """
                <html><head><style>
                  body { font-family: sans-serif; color: #1f2937; font-size: 13px; }
                  .box { border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; }
                  h1 { font-size: 20px; margin: 0 0 4px; color: #4f46e5; }
                  .muted { color: #6b7280; }
                  table { width: 100%%; border-collapse: collapse; margin-top: 16px; }
                  th, td { text-align: left; padding: 8px 6px; border-bottom: 1px solid #eee; }
                  td.amt, th.amt { text-align: right; }
                  .total td { font-weight: bold; font-size: 15px; border-top: 2px solid #333; }
                  .status { display:inline-block; padding: 4px 10px; border-radius: 999px;
                            background: #fee2e2; color: #b91c1c; font-weight: bold; }
                  .status.paid { background:#dcfce7; color:#166534; }
                </style></head><body>
                <div class="box">
                  <h1>Monthly Room Bill</h1>
                  <div class="muted">Bill #%d &#8226; %s</div>
                  <table style="margin-top:16px;border:none;">
                    <tr><td style="border:none;"><b>Property:</b> %s</td>
                        <td style="border:none;"><b>Room:</b> %s</td></tr>
                    <tr><td style="border:none;"><b>Tenant:</b> %s</td>
                        <td style="border:none;"><b>Billing Month:</b> %s</td></tr>
                  </table>
                  <table>
                    <tr><th>Description</th><th class="amt">Amount</th></tr>
                    <tr><td>Room Rent</td><td class="amt">Rs. %s</td></tr>
                    <tr><td>%s</td><td class="amt">Rs. %s</td></tr>
                    <tr><td>Other Charges</td><td class="amt">Rs. %s</td></tr>
                    <tr><td>Discount</td><td class="amt">- Rs. %s</td></tr>
                    <tr class="total"><td>Total</td><td class="amt">Rs. %s</td></tr>
                    <tr><td>Amount Paid</td><td class="amt">Rs. %s</td></tr>
                    <tr><td>Balance Due</td><td class="amt">Rs. %s</td></tr>
                  </table>
                  <p style="margin-top:16px;">Payment Status:
                     <span class="status %s">%s</span></p>
                  <p class="muted">Due Date: %s</p>
                </div>
                </body></html>
                """.formatted(
                bill.getId(), month,
                escape(propertyName), escape(roomNumber),
                escape(tenantName), month,
                trim(bill.getRentAmount()),
                elecLabel, trim(bill.getElectricityAmount()),
                trim(bill.getOtherCharges()),
                trim(bill.getDiscount()),
                trim(bill.getTotalAmount()),
                trim(bill.getAmountPaid()),
                trim(outstanding),
                bill.getStatus().name().equals("PAID") ? "paid" : "",
                bill.getStatus().name().replace("_", " "),
                due);
    }

    private String trim(BigDecimal v) {
        if (v == null) return "0";
        return v.stripTrailingZeros().toPlainString();
    }

    private String escape(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }
}
