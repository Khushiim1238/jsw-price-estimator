const PRICING_DATA = [
    { size: '8 mm', price: 393 },
    { size: '10 mm', price: 603 },
    { size: '12 mm', price: 844 },
    { size: '16 mm', price: 1502 },
    { size: '20 mm', price: 2348 },
    { size: '25 mm', price: 3660 }
];

// State to keep track of quantities
const state = {
    quantities: {},
    discount: 0
};

// Initialize quantities to 0
PRICING_DATA.forEach(item => {
    state.quantities[item.size] = 0;
});

// DOM Elements
const itemsListEl = document.getElementById('itemsList');
const subtotalAmountEl = document.getElementById('subtotalAmount');
const discountPercentEl = document.getElementById('discountPercent');
const discountAmountEl = document.getElementById('discountAmount');
const finalAmountEl = document.getElementById('finalAmount');
const customerNameEl = document.getElementById('customerName');
const customerPhoneEl = document.getElementById('customerPhone');
const sendWhatsappBtn = document.getElementById('sendWhatsappBtn');

// Helper to format currency
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(amount);
};

// Render Items
function renderItems() {
    itemsListEl.innerHTML = '';
    
    PRICING_DATA.forEach((item, index) => {
        const itemTotal = item.price * state.quantities[item.size];
        
        const row = document.createElement('div');
        row.className = 'item-row';
        row.innerHTML = `
            <div class="item-info">
                <div class="item-size">${item.size}</div>
                <div class="item-price">@ ₹${item.price} / piece</div>
            </div>
            <div class="item-qty-input">
                <input 
                    type="number" 
                    min="0" 
                    placeholder="0" 
                    value="${state.quantities[item.size] || ''}"
                    data-size="${item.size}"
                    class="qty-input"
                >
            </div>
            <div class="item-total" id="total-${index}">
                ${formatCurrency(itemTotal)}
            </div>
        `;
        
        itemsListEl.appendChild(row);
    });

    // Add event listeners to newly created inputs
    document.querySelectorAll('.qty-input').forEach(input => {
        input.addEventListener('input', (e) => {
            let val = parseInt(e.target.value);
            if (isNaN(val) || val < 0) val = 0;
            state.quantities[e.target.dataset.size] = val;
            updateCalculations();
        });
    });
}

// Update Totals
function updateCalculations() {
    let subtotal = 0;
    
    // Update individual item totals
    PRICING_DATA.forEach((item, index) => {
        const qty = state.quantities[item.size];
        const itemTotal = item.price * qty;
        subtotal += itemTotal;
        
        const totalEl = document.getElementById(`total-${index}`);
        if(totalEl) {
            totalEl.textContent = formatCurrency(itemTotal);
        }
    });

    // Update Subtotal
    subtotalAmountEl.textContent = formatCurrency(subtotal);

    // Calculate Discount
    const discountAmount = subtotal * (state.discount / 100);
    discountAmountEl.textContent = `- ${formatCurrency(discountAmount)}`;

    // Calculate Final Total
    const finalTotal = subtotal - discountAmount;
    finalAmountEl.textContent = formatCurrency(finalTotal);
}

// Event Listeners for Discount
discountPercentEl.addEventListener('input', (e) => {
    let val = parseFloat(e.target.value);
    if (isNaN(val) || val < 0) val = 0;
    if (val > 100) val = 100; // Cap at 100%
    state.discount = val;
    updateCalculations();
});

// WhatsApp Formatting and Sending
sendWhatsappBtn.addEventListener('click', () => {
    const name = customerNameEl.value.trim() || 'Customer';
    let rawPhone = customerPhoneEl.value.trim();
    let cleanPhone = rawPhone.replace(/\D/g, '');
    let displayPhone = cleanPhone ? `+91 ${cleanPhone}` : '';
    
    // Calculate totals one last time to be sure
    let subtotal = 0;
    let itemsText = '';
    
    PRICING_DATA.forEach(item => {
        const qty = state.quantities[item.size];
        if (qty > 0) {
            const itemTotal = item.price * qty;
            subtotal += itemTotal;
            itemsText += `• *${item.size}*: ${qty} pcs @ ₹${item.price} = *${formatCurrency(itemTotal)}*\n`;
        }
    });

    if (subtotal === 0) {
        alert("Please enter quantity for at least one item.");
        return;
    }

    const discountAmount = subtotal * (state.discount / 100);
    const finalTotal = subtotal - discountAmount;

    // Build the message text
    let message = `*JSW Neosteel Quotation*\n`;
    message += `------------------------------\n`;
    message += `*Customer:* ${name}\n`;
    if(displayPhone) message += `*Phone:* ${displayPhone}\n`;
    message += `------------------------------\n\n`;
    
    message += `*Items Required:*\n`;
    message += itemsText;
    message += `\n------------------------------\n`;
    message += `*Subtotal:* ${formatCurrency(subtotal)}\n`;
    
    if (state.discount > 0) {
        message += `*Discount (${state.discount}%):* -${formatCurrency(discountAmount)}\n`;
    }
    
    message += `*Final Amount:* ${formatCurrency(finalTotal)}\n`;
    message += `------------------------------\n`;
    message += `Thank you for choosing JSW Neosteel!`;

    const encodedMessage = encodeURIComponent(message);
    
    // Attempt to open WhatsApp
    let whatsappUrl = '';
    if (cleanPhone) {
        whatsappUrl = `https://wa.me/91${cleanPhone}?text=${encodedMessage}`;
    } else {
        // If no phone number provided, just let them pick contact
        whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
    }

    window.open(whatsappUrl, '_blank');
});

// PDF Generation and Sharing
const sharePdfBtn = document.getElementById('sharePdfBtn');
if (sharePdfBtn) {
    sharePdfBtn.addEventListener('click', async () => {
        const name = customerNameEl.value.trim() || 'Customer';
        let rawPhone = customerPhoneEl.value.trim();
        let cleanPhone = rawPhone.replace(/\D/g, '');
        let displayPhone = cleanPhone ? `+91 ${cleanPhone}` : '';
        
        let subtotal = 0;
        let itemsHtml = '';
        
        PRICING_DATA.forEach(item => {
            const qty = state.quantities[item.size];
            if (qty > 0) {
                const itemTotal = item.price * qty;
                subtotal += itemTotal;
                itemsHtml += `
                    <div style="margin-bottom: 5px;">
                        • <strong>${item.size}</strong>: ${qty} pcs @ ₹${item.price} = <strong>${formatCurrency(itemTotal)}</strong>
                    </div>
                `;
            }
        });

        if (subtotal === 0) {
            alert("Please enter quantity for at least one item to generate a PDF.");
            return;
        }

        const discountAmount = subtotal * (state.discount / 100);
        const finalTotal = subtotal - discountAmount;

        // Create a temporary hidden div for the PDF content
        const invoiceDiv = document.createElement('div');
        invoiceDiv.style.padding = '40px';
        invoiceDiv.style.fontFamily = "'Outfit', sans-serif";
        invoiceDiv.style.color = '#000000';
        invoiceDiv.style.backgroundColor = '#ffffff';
        invoiceDiv.style.width = '600px';
        
        invoiceDiv.innerHTML = `
            <div style="font-size: 16px; line-height: 1.6;">
                <strong>JSW Neosteel Quotation</strong><br>
                ------------------------------<br>
                <strong>Customer:</strong> ${name}<br>
                <strong>Phone:</strong> ${displayPhone || 'Not Provided'}<br>
                ------------------------------<br>
                <br>
                <strong>Items Required:</strong><br>
                ${itemsHtml}
                <br>
                ------------------------------<br>
                <strong>Subtotal:</strong> ${formatCurrency(subtotal)}<br>
                ${state.discount > 0 ? `<strong>Discount (${state.discount}%):</strong> -${formatCurrency(discountAmount)}<br>` : ''}
                <strong>Final Amount:</strong> ${formatCurrency(finalTotal)}<br>
                ------------------------------<br>
                Thank you for choosing JSW Neosteel!
            </div>
        `;

        document.body.appendChild(invoiceDiv);

        // PDF Options
        const opt = {
            margin:       0.5,
            filename:     `JSW_Quotation_${name.replace(/\s+/g, '_')}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true },
            jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
        };

        const originalBtnText = sharePdfBtn.innerHTML;
        sharePdfBtn.innerHTML = 'Generating PDF...';
        sharePdfBtn.disabled = true;

        try {
            // Generate PDF as a blob
            const pdfBlob = await html2pdf().set(opt).from(invoiceDiv).output('blob');
            
            // Check if Web Share API is available and can share files
            const file = new File([pdfBlob], opt.filename, { type: 'application/pdf' });
            
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: 'JSW Neosteel Quotation',
                    text: 'Here is your JSW Neosteel price estimate.'
                });
            } else {
                // Fallback to downloading the file if share isn't supported (e.g. desktop)
                await html2pdf().set(opt).from(invoiceDiv).save();
            }
        } catch (error) {
            console.error("PDF Generation/Share error:", error);
            // Fallback just in case outputPdf('blob') fails but save() works
            try {
                await html2pdf().set(opt).from(invoiceDiv).save();
            } catch (e) {
                alert("Could not generate PDF. Please try again.");
            }
        } finally {
            document.body.removeChild(invoiceDiv);
            sharePdfBtn.innerHTML = originalBtnText;
            sharePdfBtn.disabled = false;
        }
    });
}

// Initial Render
renderItems();
updateCalculations();
