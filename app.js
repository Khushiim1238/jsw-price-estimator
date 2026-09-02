// Pricing Data Store
let BRAND_DATA = {
    jsw: [
        { size: '8 mm', price: 393 },
        { size: '10 mm', price: 603 },
        { size: '12 mm', price: 844 },
        { size: '16 mm', price: 1502 },
        { size: '20 mm', price: 2348 },
        { size: '25 mm', price: 3660 }
    ],
    elegant: [
        { size: '6 mm', price: 241 },
        { size: '8 mm', price: 409 },
        { size: '10 mm', price: 626 },
        { size: '12 mm', price: 884 },
        { size: '16 mm', price: 1573 },
        { size: '20 mm', price: 2460 },
        { size: '25 mm', price: 3834 }
    ]
};

// Load saved prices from LocalStorage if they exist
const savedJsw = localStorage.getItem('jsw_neosteel_prices');
const savedElegant = localStorage.getItem('elegant_prices');
if (savedJsw) {
    try { BRAND_DATA.jsw = JSON.parse(savedJsw); } catch (e) { console.error('Failed to load JSW prices', e); }
}
if (savedElegant) {
    try { BRAND_DATA.elegant = JSON.parse(savedElegant); } catch (e) { console.error('Failed to load Elegant prices', e); }
}

// State
const state = {
    activeBrand: 'jsw',
    quantities: {
        jsw: {},
        elegant: {}
    },
    discount: 0
};

// Initialize quantities to 0
BRAND_DATA.jsw.forEach(item => state.quantities.jsw[item.size] = 0);
BRAND_DATA.elegant.forEach(item => state.quantities.elegant[item.size] = 0);

// Helper to get active pricing array
const getActivePricing = () => BRAND_DATA[state.activeBrand];
const getActiveQuantities = () => state.quantities[state.activeBrand];
const getActiveBrandName = () => state.activeBrand === 'jsw' ? 'JSW Neosteel' : 'Elegant Steel';

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

// Dropdown Logic
const brandDropdownBtn = document.getElementById('brandDropdownBtn');
const brandDropdownMenu = document.getElementById('brandDropdownMenu');
const activeBrandLogo = document.getElementById('activeBrandLogo');
const activeBrandName = document.getElementById('activeBrandName');

brandDropdownBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    brandDropdownMenu.classList.toggle('active');
    brandDropdownBtn.classList.toggle('open');
});

document.addEventListener('click', () => {
    brandDropdownMenu.classList.remove('active');
    brandDropdownBtn.classList.remove('open');
});

document.querySelectorAll('.brand-option').forEach(option => {
    option.addEventListener('click', (e) => {
        const selectedBrand = option.dataset.brand;
        if (state.activeBrand === selectedBrand) return; // No change

        // Update UI State
        document.querySelectorAll('.brand-option').forEach(opt => opt.classList.remove('active'));
        option.classList.add('active');
        
        state.activeBrand = selectedBrand;
        document.body.dataset.brand = selectedBrand;
        
        // Update header logo/name
        if (selectedBrand === 'jsw') {
            activeBrandLogo.src = 'images.png';
        } else {
            activeBrandLogo.src = 'elegant-steel-logo.png';
        }
        activeBrandLogo.style.display = 'block';
        activeBrandName.style.display = 'none';

        // Re-render
        renderItems();
        updateCalculations();
    });
});

// Render Items
function renderItems() {
    itemsListEl.innerHTML = '';
    const currentPricing = getActivePricing();
    const currentQuantities = getActiveQuantities();
    
    currentPricing.forEach((item, index) => {
        const itemTotal = item.price * (currentQuantities[item.size] || 0);
        
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
                    value="${currentQuantities[item.size] || ''}"
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
            state.quantities[state.activeBrand][e.target.dataset.size] = val;
            updateCalculations();
        });
    });
}

function updateCalculations() {
    let subtotal = 0;
    const currentPricing = getActivePricing();
    const currentQuantities = getActiveQuantities();
    
    // Update individual item totals
    currentPricing.forEach((item, index) => {
        const qty = currentQuantities[item.size] || 0;
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
    const currentPricing = getActivePricing();
    const currentQuantities = getActiveQuantities();
    const brandName = getActiveBrandName();
    
    currentPricing.forEach(item => {
        const qty = currentQuantities[item.size] || 0;
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
    let message = `*${brandName} Quotation*\n`;
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
    message += `Thank you for choosing ${brandName}!`;

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
                    // Fill with white background first to prevent transparent PNGs from turning black
                    ctx.fillStyle = "#ffffff";
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
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
            if (state.activeBrand === 'jsw') {
                logoBase64 = await getBase64ImageFromURL('images.png');
            } else if (state.activeBrand === 'elegant') {
                logoBase64 = await getBase64ImageFromURL('elegant-steel-logo.png');
            }
        } catch (e) {
            console.error("Could not load logo for PDF", e);
        }

        const currentPricing = getActivePricing();
        const currentQuantities = getActiveQuantities();
        const brandName = getActiveBrandName();
        const brandColor = state.activeBrand === 'jsw' ? '#1d4ed8' : '#dc2626'; // JSW Blue or Elegant Deep Red
        
        // Colors for Elegant PDF table
        const altRowColor = state.activeBrand === 'jsw' ? '#f8fafc' : '#f1f5f9';
        const pdfBorderColor = state.activeBrand === 'jsw' ? '#e2e8f0' : '#cbd5e1';

        let subtotal = 0;
        let tableBody = [
            [
                { text: 'Section Size', style: 'tableHeader' }, 
                { text: 'Quantity', style: 'tableHeader' }, 
                { text: 'Rate / piece', style: 'tableHeader' }, 
                { text: 'Total', style: 'tableHeader' }
            ]
        ];
        
        currentPricing.forEach(item => {
            const qty = currentQuantities[item.size] || 0;
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
                logoBase64 ? { image: logoBase64, width: 150, alignment: 'center', margin: [0, 0, 0, 10] } : { text: `${brandName} Quotation`, style: 'header', alignment: 'center' },
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
                            return (rowIndex === 0) ? brandColor : (rowIndex % 2 !== 0 ? altRowColor : null);
                        },
                        hLineWidth: function (i, node) {
                            return (i === 0 || i === node.table.body.length) ? 0 : 1;
                        },
                        vLineWidth: function (i, node) {
                            return 0;
                        },
                        hLineColor: function (i, node) {
                            return pdfBorderColor;
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
                            [ { text: 'Final Amount:', bold: true, alignment: 'right', margin: [0, 5, 10, 5] }, { text: formatCurrency(finalTotal).replace('₹', 'Rs. '), bold: true, alignment: 'right', margin: [0, 5, 0, 5], fontSize: 13, color: brandColor } ]
                        ]
                    },
                    layout: 'noBorders',
                    margin: [0, 10, 0, 20]
                },
                
                { canvas: [{ type: 'line', x1: 0, y1: 5, x2: 515, y2: 5, lineWidth: 1, lineColor: pdfBorderColor }] },
                { text: `\nThank you for choosing ${brandName}!`, alignment: 'center', color: '#475569', margin: [0, 10, 0, 0] }
            ],
            styles: {
                header: {
                    fontSize: 18,
                    bold: true,
                    color: brandColor
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
            const filename = `${brandName.replace(/\s+/g, '_')}_Quotation_${name.replace(/\s+/g, '_')}.pdf`;

            pdfDocGenerator.getBlob(async (blob) => {
                const file = new File([blob], filename, { type: 'application/pdf' });
                
                // 1. Download the PDF directly
                pdfDocGenerator.download(filename);
                
                // 2. If phone number exists, open WhatsApp chat automatically
                if (cleanPhone) {
                    const message = encodeURIComponent(`Here is your ${brandName} quotation. Please find the attached PDF.`);
                    const whatsappUrl = `https://wa.me/91${cleanPhone}?text=${message}`;
                    
                    // Small delay to ensure the download starts before opening the new tab
                    setTimeout(() => {
                        window.open(whatsappUrl, '_blank');
                    }, 500);
                } 
                // 3. Fallback to native share menu if no phone number was entered
                else if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    try {
                        await navigator.share({
                            files: [file],
                            title: `${brandName} Quotation`,
                            text: `Here is your ${brandName} price estimate.`
                        });
                    } catch (err) {
                        console.log('Share cancelled or failed', err);
                    }
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
    const currentPricing = getActivePricing();
    priceSettingsList.innerHTML = currentPricing.map((item, index) => `
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
    const currentPricing = getActivePricing();
    currentPricing.forEach((item, index) => {
        const input = document.getElementById(`settingPrice_${index}`);
        if (input && input.value) {
            item.price = parseFloat(input.value);
        }
    });
    
    // Save to LocalStorage based on active brand
    const storageKey = state.activeBrand === 'jsw' ? 'jsw_neosteel_prices' : 'elegant_prices';
    localStorage.setItem(storageKey, JSON.stringify(currentPricing));
    
    confirmModal.classList.remove('active');
    settingsModal.classList.remove('active');
    
    // Re-render the main items list to reflect new prices
    renderItems();
    updateCalculations();
});


// Initial Render
renderItems();
updateCalculations();
