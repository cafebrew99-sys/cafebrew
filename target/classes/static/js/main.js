document.addEventListener("DOMContentLoaded", () => {

    // ======== 1. 3D Tilt Effect ========
    document.querySelectorAll('.card-3d').forEach(card => {
        card.addEventListener('mousemove', e => {
            const rect = card.getBoundingClientRect();
            const rotateX = ((e.clientY - rect.top - rect.height / 2) / rect.height) * -10;
            const rotateY = ((e.clientX - rect.left - rect.width / 2) / rect.width) * 10;
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        });
        card.addEventListener('mouseleave', () => { card.style.transition = 'transform 0.5s ease'; card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)'; });
        card.addEventListener('mouseenter', () => { card.style.transition = 'none'; });
    });

    // ======== 2. Auth State ========
    const token = localStorage.getItem('jwt_token');
    const authSection = document.getElementById('authSection');
    let username = null, userRole = 'USER';

    if (token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            username = payload.sub;
            if (username === 'admin') userRole = 'ADMIN';
        } catch (e) {}
    }

    if (authSection) {
        if (token) {
            const extraLinks = userRole === 'ADMIN'
                ? `<a href="/admin/dashboard" class="btn btn-outline-danger rounded-pill px-3 me-2"><i class="bi bi-shield-lock"></i> Admin Panel</a>`
                : `<a href="/my-orders" class="btn btn-outline-accent rounded-pill px-3 me-2" style="border:none">My Orders</a>`;
            authSection.innerHTML = `${extraLinks}<button id="logoutBtn" class="btn btn-outline-accent rounded-pill px-4">Logout</button>`;
            document.getElementById('logoutBtn').addEventListener('click', () => { localStorage.removeItem('jwt_token'); window.location.href = '/'; });
        } else {
            authSection.innerHTML = `<a href="/login" class="btn btn-outline-accent rounded-pill px-4 me-2">Login</a><a href="/register" class="btn btn-accent rounded-pill px-4">Sign Up</a>`;
        }
    }

    // ======== 3. Global Popup Modal ========
    window.showPopup = function(message, title = "Notification", type = "info") {
        const iconMap = { info: 'bi-info-circle text-accent', success: 'bi-check-circle-fill text-success', error: 'bi-x-circle-fill text-danger', warning: 'bi-exclamation-triangle-fill text-warning' };
        let modalEl = document.getElementById('globalPopupModal');
        if (!modalEl) {
            document.body.insertAdjacentHTML('beforeend', `
            <div class="modal fade" id="globalPopupModal" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content bg-dark-theme text-white" style="border:1px solid rgba(255,255,255,0.15)">
                        <div class="modal-header border-secondary">
                            <h5 class="modal-title w-100 text-center" id="globalPopupTitle">Notification</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body text-center p-4">
                            <i id="globalPopupIcon" style="font-size:3rem"></i>
                            <p class="mt-3 lead mb-0" id="globalPopupMessage"></p>
                        </div>
                        <div class="modal-footer border-secondary justify-content-center">
                            <button type="button" class="btn btn-accent rounded-pill px-4" data-bs-dismiss="modal">OK</button>
                        </div>
                    </div>
                </div>
            </div>`);
            modalEl = document.getElementById('globalPopupModal');
        }
        document.getElementById('globalPopupTitle').innerText = title;
        document.getElementById('globalPopupMessage').innerText = message;
        document.getElementById('globalPopupIcon').className = `bi ${iconMap[type] || iconMap.info}`;
        new bootstrap.Modal(modalEl).show();
    };

    // ======== 4. Cart ========
    let cart = JSON.parse(localStorage.getItem('cafebrew_cart') || '[]');
    const cartCountBadge = document.getElementById('cartCountBadge');
    function updateCartBadge() { if (cartCountBadge) cartCountBadge.textContent = cart.reduce((a, i) => a + i.quantity, 0); }
    updateCartBadge();

    window.addToCart = function(id, name, price) {
        if (!token) { showPopup('Please login to add items to cart!', 'Login Required', 'warning'); setTimeout(() => window.location.href = '/login', 1500); return; }
        if (userRole === 'ADMIN') { showPopup('Admins cannot add to cart.', 'Access Denied', 'error'); return; }
        const ex = cart.find(i => i.productId === id);
        if (ex) ex.quantity++; else cart.push({ productId: id, name, price: parseFloat(price), quantity: 1 });
        localStorage.setItem('cafebrew_cart', JSON.stringify(cart));
        updateCartBadge();
        showPopup(`${name} added to cart!`, 'Added!', 'success');
    };

    // ======== 5. Cart Page ========
    const cartItemsContainer = document.getElementById('cartItemsContainer');
    if (cartItemsContainer) {
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = `<p class="text-light-muted text-center py-5">Your cart is empty.</p>`;
        } else {
            let html = '', total = 0;
            cart.forEach((item, idx) => {
                total += item.price * item.quantity;
                html += `<div class="d-flex justify-content-between align-items-center mb-3 border-bottom border-secondary pb-3">
                    <div><h5 class="text-white mb-0">${item.name}</h5><small class="text-accent">₹${item.price.toFixed(2)}</small></div>
                    <div class="d-flex align-items-center">
                        <button class="btn btn-sm btn-outline-accent me-2" onclick="updateCartQuantity(${idx},-1)">−</button>
                        <span class="text-white fw-bold me-2" style="min-width:24px;text-align:center">${item.quantity}</span>
                        <button class="btn btn-sm btn-outline-accent me-3" onclick="updateCartQuantity(${idx},1)">+</button>
                        <button class="btn btn-sm btn-outline-danger" onclick="removeFromCart(${idx})"><i class="bi bi-trash"></i></button>
                    </div>
                </div>`;
            });
            cartItemsContainer.innerHTML = html;
            document.getElementById('cartSubtotal').textContent = `₹${total.toFixed(2)}`;
            document.getElementById('cartTotal').textContent = `₹${total.toFixed(2)}`;
        }
    }
    window.removeFromCart = (idx) => { cart.splice(idx,1); localStorage.setItem('cafebrew_cart', JSON.stringify(cart)); window.location.reload(); };
    window.updateCartQuantity = (idx, delta) => { cart[idx].quantity += delta; if(cart[idx].quantity <= 0) cart.splice(idx,1); localStorage.setItem('cafebrew_cart', JSON.stringify(cart)); window.location.reload(); };

    // ======== 6. Checkout ========
    const checkoutForm = document.getElementById('checkoutForm');
    if (checkoutForm) {
        if (cart.length === 0) { showPopup('Your cart is empty', 'Invalid Order', 'warning'); window.location.href = '/menu'; }
        checkoutForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const address = document.getElementById('shippingAddress').value;
            const method = document.querySelector('input[name="paymentMethod"]:checked').value;
            const btn = document.querySelector('#checkoutForm button[type="submit"]');
            btn.disabled = true; btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Processing...';
            const payload = { shippingAddress: address, paymentMethod: method, items: cart.map(i => ({ productId: i.productId, quantity: i.quantity })) };
            // All orders are now COD as Razorpay is removed
            const res = await fetch('/api/checkout/submit', { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`}, body:JSON.stringify(payload) });
            if (res.ok) { localStorage.removeItem('cafebrew_cart'); window.location.href = '/my-orders'; }
            else { showPopup('Error placing order. Please try again.', 'Checkout Failed', 'error'); btn.disabled = false; btn.innerHTML = 'Place Order'; }
        });
    }

    // ======== 7. My Orders ========
    const ordersContainer = document.getElementById('ordersContainer');
    if (ordersContainer && token) {
        let allOrders = [], activeFilter = 'ALL';

        const statusBadge = { PENDING:'warning text-dark', PREPARING:'info text-dark', OUT_FOR_DELIVERY:'primary', DELIVERED:'success', CANCELLED:'danger' };

        function renderMyOrders() {
            const filtered = activeFilter === 'ALL' ? allOrders : allOrders.filter(o => o.status === activeFilter);
            if (!filtered.length) {
                ordersContainer.innerHTML = `<div class="glass-card p-5 text-center"><i class="bi bi-inbox text-accent" style="font-size:3rem"></i><p class="text-light-muted mt-3">No orders found.</p></div>`;
                return;
            }
            ordersContainer.innerHTML = filtered.map(o => {
                const badge = statusBadge[o.status] || 'secondary';
                const itemsHtml = (o.items||[]).map(i => `
                    <div class="d-flex justify-content-between px-2 py-1 rounded mb-1" style="background:rgba(255,255,255,0.04)">
                        <span class="text-light-muted"><i class="bi bi-dot text-accent"></i>${i.product ? i.product.name : 'Item'} × ${i.quantity}</span>
                        <span class="text-white">₹${(parseFloat(i.priceAtPurchase) * i.quantity).toFixed(2)}</span>
                    </div>`).join('') || '<p class="text-muted small mb-0 px-2">No item details available</p>';
                const canCancel = o.status === 'PENDING' || o.status === 'PREPARING';
                
                // Cancellation info
                let cancelInfoHtml = '';
                if (o.status === 'CANCELLED' && o.cancellation) {
                    cancelInfoHtml = `<div class="mt-2 p-2 rounded bg-danger-subtle text-danger small" style="background:rgba(220,53,69,0.1)">
                        <i class="bi bi-info-circle me-1"></i> <strong>Reason:</strong> ${o.cancellation.reason}${o.cancellation.customReason ? ' — ' + o.cancellation.customReason : ''}
                    </div>`;
                }

                return `
                <div class="mb-3 p-4 rounded-3" style="border:1px solid rgba(255,255,255,${o.status==='CANCELLED'?'0.15':'0.08'});background:rgba(255,255,255,0.03)">
                    <div class="d-flex justify-content-between align-items-start mb-3">
                        <div>
                            <h5 class="text-white mb-1">Order #${o.id} <span class="badge bg-${badge} ms-2 fs-6">${o.status}</span></h5>
                            <small class="text-muted"><i class="bi bi-calendar3 me-1"></i>${new Date(o.orderDate).toLocaleString()} &nbsp;|&nbsp; <i class="bi bi-credit-card me-1"></i>${o.paymentMethod}</small>
                        </div>
                        <h5 class="text-accent fw-bold">₹${parseFloat(o.totalAmount).toFixed(2)}</h5>
                    </div>
                    <div class="mb-3">${itemsHtml}</div>
                    ${cancelInfoHtml}
                    <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mt-3">
                        <small class="text-muted"><i class="bi bi-geo-alt me-1"></i>${o.shippingAddress}</small>
                        ${canCancel ? `<button class="btn btn-sm btn-outline-danger rounded-pill px-3" onclick="openCancelOrderModal(${o.id})"><i class="bi bi-x-circle me-1"></i>Cancel Order</button>` : ''}
                    </div>
                </div>`;
            }).join('');
        }

        fetch('/api/orders/my-orders', { headers:{'Authorization':`Bearer ${token}`} })
            .then(r => r.json()).then(orders => { allOrders = orders; renderMyOrders(); });

        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                activeFilter = btn.dataset.filter;
                renderMyOrders();
            });
        });

        window.openCancelOrderModal = (id) => {
            document.getElementById('cancelOrderId').value = id;
            const select = document.getElementById('cancelReasonSelect');
            select.innerHTML = `
                <option value="" disabled selected>Select a reason...</option>
                <option value="Changed my mind">Changed my mind</option>
                <option value="Ordered by mistake">Ordered by mistake</option>
                <option value="Long wait time">Long wait time</option>
                <option value="Found a better price elsewhere">Found a better price elsewhere</option>
                <option value="Other">Other (Type below)</option>
            `;
            document.getElementById('customReasonContainer').classList.add('d-none');
            document.getElementById('customReasonText').value = '';
            new bootstrap.Modal(document.getElementById('cancelOrderModal')).show();
        };
    }

    // ======== 8. Admin Dashboard ========
    const adminGrouped = document.getElementById('adminProductsGrouped');
    if (adminGrouped && token) {
        let allAdminOrders = [], adminOrderFilter = 'ALL';
        let allCategories = [];
        let pieChart, barChart, lineChart;

        // helpers
        function populateCategoryDropdown(selectId, selectedId = null) {
            const sel = document.getElementById(selectId);
            if (!sel) return;
            sel.innerHTML = allCategories.map(c =>
                `<option value="${c.id}" ${c.id == selectedId ? 'selected' : ''}>${c.name}</option>`
            ).join('');
        }

        // --- Load Categories ---
        const loadCategories = () => {
            return fetch('/api/admin/categories', { headers:{'Authorization':`Bearer ${token}`} })
                .then(r => r.json()).then(data => {
                    allCategories = data;
                    populateCategoryDropdown('pCategoryId');
                    populateCategoryDropdown('editPCategoryId');
                    renderCategoriesGrid(data);
                });
        };

        function renderCategoriesGrid(cats) {
            const grid = document.getElementById('categoriesGrid');
            if (!grid) return;
            grid.innerHTML = cats.map(c => `
                <div class="col-md-4 col-lg-3">
                    <div class="stat-card h-100" style="cursor:default">
                        <div class="text-center mb-2"><i class="bi ${c.icon || 'bi-tag-fill'} text-accent" style="font-size:2rem"></i></div>
                        <h6 class="text-white text-center fw-bold mb-1">${c.name}</h6>
                        <p class="text-muted text-center small mb-3">${c.description || ''}</p>
                        <div class="d-flex gap-2 justify-content-center">
                            <button class="btn btn-sm btn-outline-danger rounded-pill" onclick="deleteCategory(${c.id})"><i class="bi bi-trash"></i> Delete</button>
                        </div>
                    </div>
                </div>`).join('');
        }

        window.deleteCategory = (id) => {
            fetch(`/api/admin/categories/${id}`, { method:'DELETE', headers:{'Authorization':`Bearer ${token}`} })
                .then(async r => {
                    if (r.ok) { showPopup('Category deleted.', 'Deleted', 'success'); loadCategories(); loadAdminProducts(); }
                    else { const t = await r.text(); showPopup(t, 'Cannot Delete', 'error'); }
                });
        };

        document.getElementById('addCategoryForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const cat = { name: document.getElementById('catName').value, description: document.getElementById('catDesc').value, icon: document.getElementById('catIcon').value };
            fetch('/api/admin/categories', { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`}, body:JSON.stringify(cat) })
                .then(async r => {
                    if (r.ok) {
                        bootstrap.Modal.getInstance(document.getElementById('addCategoryModal')).hide();
                        e.target.reset();
                        showPopup('Category created!', 'Success', 'success');
                        loadCategories();
                    } else { const t = await r.text(); showPopup(t, 'Error', 'error'); }
                });
        });

        // Icon preview
        const catIconInput = document.getElementById('catIcon');
        if (catIconInput) {
            catIconInput.addEventListener('input', () => {
                const prev = document.getElementById('catIconPreview');
                if (prev) prev.className = `bi ${catIconInput.value} text-accent ms-2`;
            });
        }

        // --- Load Products (grouped by category) ---
        const loadAdminProducts = () => {
            fetch('/api/admin/products', { headers:{'Authorization':`Bearer ${token}`} })
                .then(r => r.json()).then(products => {
                    // Group by category
                    const grouped = {};
                    products.forEach(p => {
                        const catName = p.category ? p.category.name : 'Uncategorized';
                        const catIcon = p.category ? (p.category.icon || 'bi-tag-fill') : 'bi-tag-fill';
                        if (!grouped[catName]) grouped[catName] = { icon: catIcon, items: [] };
                        grouped[catName].items.push(p);
                    });

                    if (products.length === 0) {
                        adminGrouped.innerHTML = `<div class="text-center text-muted py-5"><i class="bi bi-inbox" style="font-size:3rem"></i><p class="mt-2">No products yet. Add your first one!</p></div>`;
                        return;
                    }

                    adminGrouped.innerHTML = Object.entries(grouped).map(([catName, { icon, items }]) => `
                        <div class="category-section mb-4">
                            <div class="category-section-header d-flex align-items-center gap-2 mb-3">
                                <i class="bi ${icon} text-accent fs-5"></i>
                                <span class="text-white fw-bold">${catName}</span>
                                <span class="badge bg-accent text-dark rounded-pill ms-2">${items.length}</span>
                            </div>
                            <div class="table-responsive">
                                <table class="table table-dark table-hover align-middle mb-0">
                                    <thead>
                                        <tr><th>ID</th><th>Name</th><th>Description</th><th>Price</th><th>Actions</th></tr>
                                    </thead>
                                    <tbody>
                                        ${items.map(p => `
                                        <tr>
                                            <td class="text-muted">${p.id}</td>
                                            <td class="text-white fw-semibold">${p.name}</td>
                                            <td class="text-muted small" style="max-width:200px">${p.description || ''}</td>
                                            <td class="text-accent fw-bold">₹${parseFloat(p.price).toFixed(2)}</td>
                                            <td>
                                                <div class="d-flex gap-2">
                                                    <button class="btn btn-sm btn-outline-accent rounded-pill" onclick="openEditModal(${p.id})">
                                                        <i class="bi bi-pencil-fill"></i> Edit
                                                    </button>
                                                    <button class="btn btn-sm btn-outline-danger rounded-pill" onclick="deleteProduct(${p.id})">
                                                        <i class="bi bi-trash-fill"></i> Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>`).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>`).join('');

                    // Robustly re-populate dropdowns after categories loaded
                    populateCategoryDropdown('pCategoryId');
                    populateCategoryDropdown('editPCategoryId');
                });
        };

        // --- Product Actions ---
        // Store products for edit modal reference
        let productsCache = [];

        window.openEditModal = (id) => {
            fetch('/api/admin/products', { headers:{'Authorization':`Bearer ${token}`} })
                .then(r => r.json()).then(products => {
                    const p = products.find(x => x.id === id);
                    if (!p) return;
                    document.getElementById('editProductId').value = p.id;
                    document.getElementById('editPName').value = p.name;
                    document.getElementById('editPDesc').value = p.description || '';
                    document.getElementById('editPPrice').value = p.price;
                    document.getElementById('editPImageUrl').value = p.imageUrl || '';
                    populateCategoryDropdown('editPCategoryId', p.category ? p.category.id : null);
                    new bootstrap.Modal(document.getElementById('editProductModal')).show();
                });
        };

        window.deleteProduct = (id) => {
            fetch(`/api/admin/products/${id}`, { method:'DELETE', headers:{'Authorization':`Bearer ${token}`} })
                .then(async r => {
                    if (r.ok) { showPopup('Product deleted.', 'Deleted', 'success'); loadAdminProducts(); }
                    else { const t = await r.text(); showPopup(t, 'Error', 'error'); }
                });
        };

        document.getElementById('editProductForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const id = document.getElementById('editProductId').value;
            const payload = {
                name: document.getElementById('editPName').value,
                description: document.getElementById('editPDesc').value,
                price: parseFloat(document.getElementById('editPPrice').value),
                categoryId: parseInt(document.getElementById('editPCategoryId').value),
                imageUrl: document.getElementById('editPImageUrl').value
            };
            fetch(`/api/admin/products/${id}`, { method:'PUT', headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`}, body:JSON.stringify(payload) })
                .then(async r => {
                    if (r.ok) {
                        bootstrap.Modal.getInstance(document.getElementById('editProductModal')).hide();
                        showPopup('Product updated!', 'Updated', 'success');
                        loadAdminProducts();
                    } else { const t = await r.text(); showPopup(t, 'Error', 'error'); }
                });
        });

        document.getElementById('addProductForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const payload = {
                name: document.getElementById('pName').value,
                description: document.getElementById('pDesc').value,
                price: parseFloat(document.getElementById('pPrice').value),
                categoryId: parseInt(document.getElementById('pCategoryId').value),
                imageUrl: document.getElementById('pImageUrl').value
            };
            fetch('/api/admin/products', { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`}, body:JSON.stringify(payload) })
                .then(async r => {
                    if (r.ok) {
                        bootstrap.Modal.getInstance(document.getElementById('addProductModal')).hide();
                        e.target.reset();
                        showPopup('Product added!', 'Success', 'success');
                        loadAdminProducts();
                    } else { const t = await r.text(); showPopup(t, 'Error', 'error'); }
                });
        });

        // --- Load Orders ---
        const statusBadgeMap = { PENDING:'warning text-dark', PREPARING:'info text-dark', OUT_FOR_DELIVERY:'primary', DELIVERED:'success', CANCELLED:'danger' };

        const renderAdminOrders = () => {
            const container = document.getElementById('adminOrdersContainer');
            if (!container) return;
            const filtered = adminOrderFilter === 'ALL' ? allAdminOrders : allAdminOrders.filter(o => o.status === adminOrderFilter);
            if (!filtered.length) {
                container.innerHTML = `<div class="text-center text-muted py-5"><i class="bi bi-inbox" style="font-size:3rem"></i><p class="mt-2">No ${adminOrderFilter} orders</p></div>`;
                return;
            }
            container.innerHTML = filtered.map(o => {
                const badge = statusBadgeMap[o.status] || 'secondary';
                const isFinalized = o.status === 'DELIVERED' || o.status === 'CANCELLED';
                const itemsHtml = (o.items||[]).map(i => `
                    <span class="badge bg-dark border border-secondary me-1 mb-1 fw-normal">
                        ${i.product ? i.product.name : 'Item'} ×${i.quantity} — ₹${(parseFloat(i.priceAtPurchase)*i.quantity).toFixed(2)}
                    </span>`).join('');
                
                let cancelInfoHtml = '';
                if (o.status === 'CANCELLED' && o.cancellation) {
                    cancelInfoHtml = `<div class="mt-2 text-danger small"><i class="bi bi-info-circle me-1"></i>Cancelled by ${o.cancellation.cancelledBy}: ${o.cancellation.reason}</div>`;
                }

                return `
                <div class="mb-3 p-4 rounded-3" style="border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.03)">
                    <div class="d-flex flex-wrap justify-content-between gap-3">
                        <div>
                            <h6 class="text-white mb-1">
                                Order #${o.id} — <span class="text-accent">${o.user ? o.user.username : 'User'}</span>
                                <span class="badge bg-${badge} ms-2">${o.status}</span>
                            </h6>
                            <small class="text-muted">${new Date(o.orderDate).toLocaleString()} | ${o.paymentMethod} | <i class="bi bi-geo-alt"></i> ${o.shippingAddress}</small>
                            <div class="mt-2">${itemsHtml}</div>
                            ${cancelInfoHtml}
                        </div>
                        <div class="d-flex flex-column align-items-end gap-2">
                            <span class="text-accent fw-bold fs-5">₹${parseFloat(o.totalAmount).toFixed(2)}</span>
                            ${!isFinalized ? `
                            <select class="form-select form-select-sm" style="width:auto;min-width:160px" onchange="adminChangeStatus(${o.id}, this.value)">
                                <option value="" disabled selected>Change Status</option>
                                <option value="PENDING">PENDING</option>
                                <option value="PREPARING">PREPARING</option>
                                <option value="OUT_FOR_DELIVERY">OUT FOR DELIVERY</option>
                                <option value="DELIVERED">DELIVERED</option>
                                <option value="CANCELLED">CANCELLED</option>
                            </select>` : `<span class="badge bg-${badge} px-3 py-2">Finalized</span>`}
                        </div>
                    </div>
                </div>`;
            }).join('');
        };

        const updateKPIs = (orders) => {
            document.getElementById('kpiPending').textContent = orders.filter(o => o.status === 'PENDING').length;
            document.getElementById('kpiDelivered').textContent = orders.filter(o => o.status === 'DELIVERED').length;
            document.getElementById('kpiCancelled').textContent = orders.filter(o => o.status === 'CANCELLED').length;
            const rev = orders.filter(o => o.status !== 'CANCELLED').reduce((s, o) => s + parseFloat(o.totalAmount), 0);
            document.getElementById('kpiRevenue').textContent = `₹${rev.toFixed(0)}`;
        };

        const renderCharts = (orders) => {
            const statusCounts = { PENDING:0, PREPARING:0, OUT_FOR_DELIVERY:0, DELIVERED:0, CANCELLED:0 };
            const payRevenue = {}, dateCounts = {};
            orders.forEach(o => {
                statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
                const m = o.paymentMethod || 'Unknown';
                if (o.status !== 'CANCELLED') payRevenue[m] = (payRevenue[m] || 0) + parseFloat(o.totalAmount);
                const d = new Date(o.orderDate).toLocaleDateString('en-IN', { day:'2-digit', month:'short' });
                dateCounts[d] = (dateCounts[d] || 0) + 1;
            });
            Chart.defaults.color = '#aaa'; Chart.defaults.font.family = 'Outfit';
            if (pieChart) pieChart.destroy(); if (barChart) barChart.destroy(); if (lineChart) lineChart.destroy();

            pieChart = new Chart(document.getElementById('statusPieChart'), {
                type:'doughnut',
                data:{ labels:Object.keys(statusCounts), datasets:[{ data:Object.values(statusCounts), backgroundColor:['#ffc107','#0dcaf0','#0d6efd','#198754','#dc3545'], borderWidth:0, hoverOffset:8 }] },
                options:{ plugins:{ legend:{ position:'bottom', labels:{ color:'#ccc', padding:12 } } }, cutout:'65%' }
            });
            barChart = new Chart(document.getElementById('revenueBarChart'), {
                type:'bar',
                data:{ labels:Object.keys(payRevenue), datasets:[{ label:'Revenue (₹)', data:Object.values(payRevenue), backgroundColor:'rgba(203, 178, 106, 0.7)', borderColor:'#cbb26a', borderWidth:2, borderRadius:8 }] },
                options:{ plugins:{ legend:{ display:false } }, scales:{ x:{ grid:{ color:'rgba(255,255,255,0.05)' } }, y:{ grid:{ color:'rgba(255,255,255,0.05)' }, ticks:{ callback:v=>'₹'+v } } } }
            });
            const sortedDates = Object.keys(dateCounts).sort((a,b) => new Date(a)-new Date(b));
            lineChart = new Chart(document.getElementById('ordersTrendChart'), {
                type:'line',
                data:{ labels:sortedDates, datasets:[{ label:'Orders', data:sortedDates.map(d=>dateCounts[d]), borderColor:'#cbb26a', backgroundColor:'rgba(203, 178, 106, 0.12)', fill:true, tension:0.4, pointBackgroundColor:'#cbb26a', pointRadius:5 }] },
                options:{ plugins:{ legend:{ display:false } }, scales:{ x:{ grid:{ color:'rgba(255,255,255,0.05)' } }, y:{ grid:{ color:'rgba(255,255,255,0.05)' }, ticks:{ stepSize:1 } } } }
            });
        };

        const loadAdminOrders = () => {
            fetch('/api/admin/orders', { headers:{'Authorization':`Bearer ${token}`} })
                .then(r => r.json()).then(data => {
                    allAdminOrders = data;
                    renderAdminOrders();
                    updateKPIs(data);
                    try { renderCharts(data); } catch(e) {}
                });
        };

        window.adminChangeStatus = (id, st) => {
            if (st === 'CANCELLED') {
                window.openAdminCancelModal(id);
                return;
            }
            fetch(`/api/admin/orders/${id}/status`, { method:'PUT', headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`}, body:JSON.stringify({status:st}) })
                .then(async r => {
                    if (!r.ok) { const t = await r.text(); showPopup(t, 'Cannot Update', 'error'); }
                    loadAdminOrders();
                });
        };

        window.openAdminCancelModal = (id) => {
            document.getElementById('cancelOrderId').value = id;
            const select = document.getElementById('cancelReasonSelect');
            select.innerHTML = `
                <option value="" disabled selected>Select admin reason...</option>
                <option value="Item out of stock">Item out of stock</option>
                <option value="Store closed">Store closed</option>
                <option value="Delivery partner unavailable">Delivery partner unavailable</option>
                <option value="Fraudulent order">Fraudulent order</option>
                <option value="Other">Other (Type below)</option>
            `;
            document.getElementById('customReasonContainer').classList.add('d-none');
            document.getElementById('customReasonText').value = '';
            new bootstrap.Modal(document.getElementById('cancelOrderModal')).show();
        };

        document.getElementById('orders-tab').addEventListener('click', loadAdminOrders);
        document.getElementById('analytics-tab').addEventListener('click', () => { loadAdminOrders(); });

        document.querySelectorAll('#adminOrderFilters .filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('#adminOrderFilters .filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                adminOrderFilter = btn.dataset.filter;
                renderAdminOrders();
            });
        });

        // Initial load
        loadCategories().then(() => loadAdminProducts());
    }

    // ======== 9. Menu Cart Binder ========
    document.querySelectorAll('.glass-product-card').forEach(card => {
        const btn = card.querySelector('.btn-outline-accent');
        if (btn) {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const name = card.querySelector('h4').innerText;
                const priceText = card.querySelector('.text-accent').innerText.replace(/[₹$]/g,'').trim();
                addToCart(parseInt(card.getAttribute('data-pid')), name, priceText);
            });
        }
    });

    // ======== 10. Login Form ========
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const u = document.getElementById('username').value;
            const p = document.getElementById('password').value;
            const res = await fetch('/api/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({username:u, password:p}) });
            if (res.ok) {
                const data = await res.json();
                localStorage.setItem('jwt_token', data.token);
                window.location.href = u === 'admin' ? '/admin/dashboard' : '/menu';
            } else {
                const a = document.getElementById('authAlert');
                if (a) { a.classList.remove('d-none'); a.innerText = 'Invalid username or password.'; }
            }
        });
    }

    // ======== 11. Register Form ========
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.querySelector('#registerForm button[type="submit"]');
            const alertDiv = document.getElementById('authAlert');
            const u = document.getElementById('reg-username').value;
            const p = document.getElementById('reg-password').value;
            btn.disabled = true; btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Processing...';
            alertDiv.classList.add('d-none');
            const res = await fetch('/api/auth/register', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({username:u, password:p}) });
            if (res.ok) {
                const data = await res.json(); localStorage.setItem('jwt_token', data.token); window.location.href = '/menu';
            } else {
                const t = await res.text();
                alertDiv.innerText = t || 'Registration failed. Username may be taken.';
                alertDiv.classList.remove('d-none'); alertDiv.classList.add('alert-danger');
                btn.disabled = false; btn.innerHTML = 'Sign Up';
            }
        });
    }
    // ======== 12. Cancellation Modal Global Handlers ========
    const cancelReasonSelect = document.getElementById('cancelReasonSelect');
    if (cancelReasonSelect) {
        cancelReasonSelect.addEventListener('change', (e) => {
            const container = document.getElementById('customReasonContainer');
            if (e.target.value === 'Other') {
                container.classList.remove('d-none');
            } else {
                container.classList.add('d-none');
            }
        });
    }

    const confirmCancelBtn = document.getElementById('confirmCancelBtn');
    if (confirmCancelBtn) {
        confirmCancelBtn.addEventListener('click', async () => {
            const id = document.getElementById('cancelOrderId').value;
            const reason = document.getElementById('cancelReasonSelect').value;
            const customReason = document.getElementById('customReasonText').value;

            if (!reason) {
                showPopup('Please select a reason for cancellation.', 'Reason Required', 'warning');
                return;
            }

            confirmCancelBtn.disabled = true;
            confirmCancelBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Cancelling...';

            const url = userRole === 'ADMIN' ? `/api/admin/orders/${id}/cancel` : `/api/orders/${id}/cancel`;
            const payload = { reason, customReason: reason === 'Other' ? customReason : '' };

            try {
                const res = await fetch(url, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(payload)
                });

                if (res.ok) {
                    const modal = bootstrap.Modal.getInstance(document.getElementById('cancelOrderModal'));
                    if (modal) modal.hide();
                    showPopup('Order cancelled successfully.', 'Cancelled', 'success');
                    setTimeout(() => window.location.reload(), 1500);
                } else {
                    const t = await res.text();
                    showPopup(t, 'Cancellation Failed', 'error');
                }
            } catch (err) {
                showPopup('A network error occurred.', 'Error', 'error');
            } finally {
                confirmCancelBtn.disabled = false;
                confirmCancelBtn.innerHTML = 'Confirm Cancellation';
            }
        });
    }
});
