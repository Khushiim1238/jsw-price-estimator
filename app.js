let PRICING_DATA = [
    { size: '8 mm', price: 393 },
    { size: '10 mm', price: 603 },
    { size: '12 mm', price: 844 },
    { size: '16 mm', price: 1502 },
    { size: '20 mm', price: 2348 },
    { size: '25 mm', price: 3660 }
];

// Load saved prices from LocalStorage if they exist
const savedPrices = localStorage.getItem('jsw_neosteel_prices');
if (savedPrices) {
    try {
        PRICING_DATA = JSON.parse(savedPrices);
    } catch (e) {
        console.error('Failed to load saved prices', e);
    }
}

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
        
        // Function to get image as base64
        const getBase64ImageFromURL = (url) => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.setAttribute("crossOrigin", "anonymous");
                img.onload = () => {
                    const canvas = document.createElement("canvas");
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext("2d");
                    ctx.drawImage(img, 0, 0);
                    resolve(canvas.toDataURL("image/png"));
                };
                img.onerror = reject;
                img.src = url;
            });
        };

        const originalBtnText = sharePdfBtn.innerHTML;
        sharePdfBtn.innerHTML = 'Generating PDF...';
        sharePdfBtn.disabled = true;

        let logoBase64 = null;
        try {
            logoBase64 = await getBase64ImageFromURL('images.png');
        } catch (e) {
            console.error("Could not load logo for PDF", e);
        }

        let subtotal = 0;
        let tableBody = [
            [
                { text: 'Section Size', style: 'tableHeader' }, 
                { text: 'Quantity', style: 'tableHeader' }, 
                { text: 'Rate / piece', style: 'tableHeader' }, 
                { text: 'Total', style: 'tableHeader' }
            ]
        ];
        
        PRICING_DATA.forEach(item => {
            const qty = state.quantities[item.size];
            if (qty > 0) {
                const itemTotal = item.price * qty;
                subtotal += itemTotal;
                tableBody.push([
                    { text: item.size, bold: true },
                    qty.toString(),
                    formatCurrency(item.price).replace('₹', 'Rs. '),
                    { text: formatCurrency(itemTotal).replace('₹', 'Rs. '), bold: true }
                ]);
            }
        });

        if (subtotal === 0) {
            alert("Please enter quantity for at least one item to generate a PDF.");
            sharePdfBtn.innerHTML = originalBtnText;
            sharePdfBtn.disabled = false;
            return;
        }

        const discountAmount = subtotal * (state.discount / 100);
        const finalTotal = subtotal - discountAmount;
        const dateStr = new Date().toLocaleDateString('en-IN');

        const docDefinition = {
            pageSize: 'A4',
            pageMargins: [40, 40, 40, 40],
            defaultStyle: {
                fontSize: 11,
                lineHeight: 1.2
            },
            content: [
                // Header with Logo
                logoBase64 ? { image: logoBase64, width: 150, alignment: 'center', margin: [0, 0, 0, 10] } : { text: 'JSW Neosteel Quotation', style: 'header', alignment: 'center' },
                { canvas: [{ type: 'line', x1: 0, y1: 5, x2: 515, y2: 5, lineWidth: 1 }] },
                { text: '\n' },
                {
                    columns: [
                        { text: [ { text: 'Customer: ', bold: true }, name, '\n', { text: 'Phone: ', bold: true }, displayPhone || 'Not Provided' ] },
                        { text: [ { text: 'Date: ', bold: true }, dateStr ], alignment: 'right' }
                    ]
                },
                { text: '\n' },
                
                // Items Table
                { text: 'Items Required:', bold: true, margin: [0, 0, 0, 8] },
                {
                    table: {
                        headerRows: 1,
                        widths: ['*', 'auto', 'auto', 'auto'],
                        body: tableBody
                    },
                    layout: {
                        fillColor: function (rowIndex) {
                            return (rowIndex === 0) ? '#1d4ed8' : (rowIndex % 2 !== 0 ? '#f8fafc' : null);
                        },
                        hLineWidth: function (i, node) {
                            return (i === 0 || i === node.table.body.length) ? 0 : 1;
                        },
                        vLineWidth: function (i, node) {
                            return 0;
                        },
                        hLineColor: function (i, node) {
                            return '#e2e8f0';
                        },
                        paddingTop: function(i, node) { return 8; },
                        paddingBottom: function(i, node) { return 8; },
                        paddingLeft: function(i, node) { return 10; },
                        paddingRight: function(i, node) { return 10; },
                    }
                },
                { text: '\n' },
                
                // Summary Box
                {
                    table: {
                        widths: ['*', 'auto'],
                        body: [
                            [ { text: 'Subtotal:', alignment: 'right', margin: [0, 5, 10, 5] }, { text: formatCurrency(subtotal).replace('₹', 'Rs. '), alignment: 'right', margin: [0, 5, 0, 5] } ],
                            ...(state.discount > 0 ? [[ { text: `Discount (${state.discount}%):`, alignment: 'right', margin: [0, 5, 10, 5], color: '#dc2626' }, { text: `-${formatCurrency(discountAmount).replace('₹', 'Rs. ')}`, alignment: 'right', margin: [0, 5, 0, 5], color: '#dc2626' } ]] : []),
                            [ { text: 'Final Amount:', bold: true, alignment: 'right', margin: [0, 5, 10, 5] }, { text: formatCurrency(finalTotal).replace('₹', 'Rs. '), bold: true, alignment: 'right', margin: [0, 5, 0, 5], fontSize: 13, color: '#1d4ed8' } ]
                        ]
                    },
                    layout: 'noBorders',
                    margin: [0, 10, 0, 20]
                },
                
                { canvas: [{ type: 'line', x1: 0, y1: 5, x2: 515, y2: 5, lineWidth: 1, lineColor: '#e2e8f0' }] },
                { text: '\nThank you for choosing JSW Neosteel!', alignment: 'center', color: '#475569', margin: [0, 10, 0, 0] }
            ],
            styles: {
                header: {
                    fontSize: 18,
                    bold: true,
                    color: '#1d4ed8'
                },
                tableHeader: {
                    bold: true,
                    fontSize: 12,
                    color: 'white'
                }
            }
        };

        try {
            const pdfDocGenerator = pdfMake.createPdf(docDefinition);
            const filename = `JSW_Quotation_${name.replace(/\s+/g, '_')}.pdf`;

            pdfDocGenerator.getBlob(async (blob) => {
                const file = new File([blob], filename, { type: 'application/pdf' });
                
                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    try {
                        await navigator.share({
                            files: [file],
                            title: 'JSW Neosteel Quotation',
                            text: 'Here is your JSW Neosteel price estimate.'
                        });
                    } catch (err) {
                        console.log('Share cancelled or failed', err);
                        // Fallback to downloading if share fails
                        pdfDocGenerator.download(filename);
                    }
                } else {
                    // Fallback to downloading
                    pdfDocGenerator.download(filename);
                }
                
                sharePdfBtn.innerHTML = originalBtnText;
                sharePdfBtn.disabled = false;
            });
        } catch (error) {
            console.error("PDF Generation error:", error);
            sharePdfBtn.innerHTML = originalBtnText;
            sharePdfBtn.disabled = false;
            alert("Failed to generate PDF. Please try again.");
        }
    });
}

// --- Settings Modal Logic ---
const settingsBtn = document.getElementById('settingsBtn');
const settingsModal = document.getElementById('settingsModal');
const cancelSettingsBtn = document.getElementById('cancelSettingsBtn');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');
const priceSettingsList = document.getElementById('priceSettingsList');

function renderSettings() {
    priceSettingsList.innerHTML = PRICING_DATA.map((item, index) => `
        <div class="setting-item">
            <label>${item.size}</label>
            <input type="number" id="settingPrice_${index}" value="${item.price}" min="0">
        </div>
    `).join('');
}

const confirmModal = document.getElementById('confirmModal');
const cancelConfirmBtn = document.getElementById('cancelConfirmBtn');
const confirmSaveBtn = document.getElementById('confirmSaveBtn');

function initiateSave() {
    confirmModal.classList.add('active');
}

settingsBtn.addEventListener('click', () => {
    renderSettings();
    settingsModal.classList.add('active');
});

cancelSettingsBtn.addEventListener('click', () => {
    settingsModal.classList.remove('active');
});

saveSettingsBtn.addEventListener('click', initiateSave);

// Handle Enter key on the inputs
priceSettingsList.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        initiateSave();
    }
});

cancelConfirmBtn.addEventListener('click', () => {
    confirmModal.classList.remove('active');
});

confirmSaveBtn.addEventListener('click', () => {
    PRICING_DATA.forEach((item, index) => {
        const input = document.getElementById(`settingPrice_${index}`);
        if (input && input.value) {
            item.price = parseFloat(input.value);
        }
    });
    
    // Save to LocalStorage
    localStorage.setItem('jsw_neosteel_prices', JSON.stringify(PRICING_DATA));
    
    confirmModal.classList.remove('active');
    settingsModal.classList.remove('active');
    
    // Re-render the main items list to reflect new prices
    renderItems();
    updateCalculations();
});


// Initial Render
renderItems();
updateCalculations();
