//data product
function getProductsFromPage() {
    const products = [];
    const productCards = document.querySelectorAll('.card');
    
    productCards.forEach((card, index) => {
        // get product name
        const nameElement = card.querySelector('h4');
        const productName = nameElement ? nameElement.textContent.trim() : `兔子产品 ${index + 1}`;
        
        // get product text
        const descElement = card.querySelector('.card-text');
        const description = descElement ? descElement.textContent.trim() : '';
        
        // get price
        const priceElement = card.querySelector('.text-body-secondary');
        let price = 0;
        if (priceElement) {
            let priceText = priceElement.textContent;
            price = parseFloat(priceText.replace('RM', '').trim());
        }
        
        // get image
        const imgElement = card.querySelector('.card-img-top');
        const image = imgElement ? imgElement.src : '';
        
        // get buy btn
        const buyBtn = card.querySelector('.btn-group .btn:last-child');
        
        if (buyBtn && productName) {
            products.push({
                id: `prod_${index}`,
                name: productName,
                desc: description,
                price: price,
                image: image,
                button: buyBtn
            });
        }
    });
    
    return products;
}

// cart state
let cart = [];

// DOM elements
let cartFloatBtn, cartCountBadge, cartSidebarPanel, closeSidebarBtn, cartItemsContainer, cartTotalSpan, addToast;

// Initialize DOM references
function initDOMElements() {
    // Create shopping cart
    if (!document.getElementById('cartFloatBtn')) {
        const cartHTML = `
            <div id="cartFloatBtn" class="cart-float">
                <i class="fa-solid fa-cart-plus " style="color: rgb(255, 255, 255); font-size: 42px"></i>
                <span id="cartCountBadge" class="cart-badge" style="display: none;">0</span>
            </div>
            <div id="cartSidebarPanel" class="cart-sidebar" style="display: none;">
                <div class="cart-header">
                    <h3>🛍️ My Cart</h3>
                    <button id="closeSidebarBtn" class="close-cart">✕</button>
                </div>
                <div id="cartItemsContainer" class="cart-items-list">
                    <div class="empty-cart-msg">✨ The shopping cart is still empty<br>Click "Buy" to add a rabbit!</div>
                </div>
                <div class="cart-footer">
                    <div class="total-row">
                        <span>Total Price</span>
                        <span id="cartTotalAmount">RM 0.00</span>
                    </div>
                    <button id="paymentBtn" class="payment-btn-purple">💳 Payment</button>
                </div>
            </div>
            <div id="addToast" class="toast-feedback">+1 Added to cart 🐰</div>
        `;
        document.body.insertAdjacentHTML('beforeend', cartHTML);
    }
    
    cartFloatBtn = document.getElementById('cartFloatBtn');
    cartCountBadge = document.getElementById('cartCountBadge');
    cartSidebarPanel = document.getElementById('cartSidebarPanel');
    closeSidebarBtn = document.getElementById('closeSidebarBtn');
    cartItemsContainer = document.getElementById('cartItemsContainer');
    cartTotalSpan = document.getElementById('cartTotalAmount');
    addToast = document.getElementById('addToast');
}

// display noti
function showToast(message) {
    if (!addToast) return;
    addToast.textContent = message || '+1 Added to cart 🐰';
    addToast.classList.add('show-toast');
    setTimeout(() => {
        addToast.classList.remove('show-toast');
    }, 1800);
}

// update the cart badge
function updateCartBadge() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (totalItems > 0) {
        cartCountBadge.textContent = totalItems;
        cartCountBadge.style.display = 'flex';
    } else {
        cartCountBadge.style.display = 'none';
    }
}

// calculate the total price
function updateTotalPrice() {
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    if (cartTotalSpan) {
        cartTotalSpan.textContent = `RM ${total.toFixed(2)}`;
    }
}

// cart sidebar
function renderCartSidebar() {
    if (!cartItemsContainer) return;
    
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<div class="empty-cart-msg">✨ The shopping cart is still empty<br>Click "Buy" to add a rabbit!</div>';
        updateTotalPrice();
        updateCartBadge();
        return;
    }
    
    let itemsHtml = '';
    cart.forEach((item) => {
        itemsHtml += `
            <div class="cart-item" data-item-id="${item.id}">
                <img class="cart-item-img" src="${item.image}" alt="${escapeHtml(item.name)}" loading="lazy">
                <div class="cart-item-info">
                    <div class="cart-item-name">🐰 ${escapeHtml(item.name)}</div>
                    <div class="cart-item-price">RM ${item.price.toFixed(2)}</div>
                </div>
                <div class="cart-item-qty">
                    <button class="qty-btn dec-qty" data-id="${item.id}">−</button>
                    <span>${item.quantity}</span>
                    <button class="qty-btn inc-qty" data-id="${item.id}">+</button>
                </div>
                <button class="remove-item" data-id="${item.id}">🗑️</button>
            </div>
        `;
    });
    
    cartItemsContainer.innerHTML = itemsHtml;
    updateTotalPrice();
    updateCartBadge();
    
    // quanlity adjust
    document.querySelectorAll('.dec-qty').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = btn.getAttribute('data-id');
            updateItemQuantity(id, -1);
        });
    });
    
    document.querySelectorAll('.inc-qty').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = btn.getAttribute('data-id');
            updateItemQuantity(id, 1);
        });
    });
    
    document.querySelectorAll('.remove-item').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = btn.getAttribute('data-id');
            removeCartItem(id);
        });
    });
}

// Preventing XSS
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// update the product quantity
function updateItemQuantity(productId, delta) {
    const itemIndex = cart.findIndex(item => item.id === productId);
    if (itemIndex === -1) return;
    
    const newQuantity = cart[itemIndex].quantity + delta;
    
    if (newQuantity <= 0) {
        cart.splice(itemIndex, 1);
        showToast('🗑️ Removed from shopping cart');
    } else {
        cart[itemIndex].quantity = newQuantity;
        showToast(`${delta > 0 ? '+1' : '-1'} ${cart[itemIndex].name}`);
    }
    
    renderCartSidebar();
}

// remove item
function removeCartItem(productId) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        cart = cart.filter(item => item.id !== productId);
        showToast(`❌ Removed ${item.name}`);
        renderCartSidebar();
    }
}

// add to cart
function addToCart(product) {
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
        existingItem.quantity += 1;
        showToast(`🐰 ${product.name} quantity +1`);
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: 1
        });
        showToast(`🐰 ${product.name} Added to cart`);
    }
    
    renderCartSidebar();
}

// Bind all Buy buttons
function bindBuyButtons() {
    const products = getProductsFromPage();
    
    console.log('Number of products found :', products.length);
    products.forEach(product => {
        console.log('Product Name:', product.name, 'Price:', product.price);
        
        if (product.button) {
            // Remove the existing event to avoid duplicate binding
            const newBtn = product.button.cloneNode(true);
            product.button.parentNode.replaceChild(newBtn, product.button);
            product.button = newBtn;
            
            product.button.addEventListener('click', (e) => {
                e.preventDefault();
                addToCart(product);
            });
        }
    });
}

// Shopping cart btn click
function bindCartFloatEvent() {
    if (cartFloatBtn) {
        cartFloatBtn.addEventListener('click', () => {
            if (cartSidebarPanel) {
                if (cartSidebarPanel.classList.contains('show')) {
                    cartSidebarPanel.classList.remove('show');
                    setTimeout(() => {
                        cartSidebarPanel.style.display = 'none';
                    }, 200);
                } else {
                    cartSidebarPanel.style.display = 'flex';
                    setTimeout(() => {
                        cartSidebarPanel.classList.add('show');
                    }, 10);
                    renderCartSidebar();
                }
            }
        });
    }
    
    if (closeSidebarBtn) {
        closeSidebarBtn.addEventListener('click', () => {
            if (cartSidebarPanel) {
                cartSidebarPanel.classList.remove('show');
                setTimeout(() => {
                    cartSidebarPanel.style.display = 'none';
                }, 200);
            }
        });
    }
}

// Click elsewhere to close the sidebar
function bindOutsideClick() {
    document.addEventListener('click', (e) => {
        if (cartSidebarPanel && cartSidebarPanel.classList.contains('show')) {
            if (!cartSidebarPanel.contains(e.target) && !cartFloatBtn.contains(e.target)) {
                cartSidebarPanel.classList.remove('show');
                setTimeout(() => {
                    cartSidebarPanel.style.display = 'none';
                }, 200);
            }
        }
    });
}

// view product
function bindViewButtons() {
    const productCards = document.querySelectorAll('.card');
    
    productCards.forEach((card) => {
        const viewBtn = card.querySelector('.btn-group .btn:first-child');
        const imgElement = card.querySelector('.card-img-top');
        const nameElement = card.querySelector('h4');
        
        if (viewBtn && imgElement) {
            const productName = nameElement ? nameElement.textContent.trim() : 'Rabbit';
            const imageSrc = imgElement.src;
            
            const newViewBtn = viewBtn.cloneNode(true);
            viewBtn.parentNode.replaceChild(newViewBtn, viewBtn);
            
            newViewBtn.addEventListener('click', (e) => {
                e.preventDefault();
                showImageViewer(imageSrc, productName);
            });
        }
    });
}

function showImageViewer(imageSrc, productName) {
    const existingViewer = document.getElementById('customImageViewer');
    if (existingViewer) {
        existingViewer.remove();
    }
    
    // create view html
    const viewerHTML = `
        <div id="customImageViewer" style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.85);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            cursor: pointer;
        ">
            <div style="
                background: white;
                border-radius: 20px;
                padding: 20px;
                max-width: 90%;
                max-height: 90%;
                text-align: center;
                position: relative;
                cursor: default;
            ">
                <button style="
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    background: #ff5722;
                    color: white;
                    border: none;
                    width: 35px;
                    height: 35px;
                    border-radius: 50%;
                    font-size: 20px;
                    cursor: pointer;
                    font-weight: bold;
                " onclick="this.parentElement.parentElement.remove()">✕</button>
                <img src="${imageSrc}" alt="${productName}" style="
                    max-width: 80vw;
                    max-height: 70vh;
                    object-fit: contain;
                    border-radius: 12px;
                ">
                <p style="margin-top: 15px; font-size: 18px; font-weight: bold; color: #5D3A1A;">${productName}</p>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', viewerHTML);
    
    // click the backgroud off view
    const viewer = document.getElementById('customImageViewer');
    viewer.addEventListener('click', function(e) {
        if (e.target === this) {
            this.remove();
        }
    });
}

// Login & Sign-up Function

// Create Login & Sign-up modal
function createAuthModals() {
    // Create Login Modal
    if (!document.getElementById('loginModal')) {
        const loginModalHTML = `
            <div id="loginModal" class="auth-modal" style="display: none;">
                <div class="auth-modal-content">
                    <div class="auth-modal-header">
                        <h2>🔐 Login to Rabbit's Home</h2>
                        <button class="auth-close-btn">&times;</button>
                    </div>
                    <div class="auth-modal-body">
                        <form id="loginForm">
                            <div class="form-group">
                                <label>📧 Email Address</label>
                                <input type="email" id="loginEmail" placeholder="Enter your email" required>
                            </div>
                            <div class="form-group">
                                <label>🔒 Password</label>
                                <input type="password" id="loginPassword" placeholder="Enter your password" required>
                            </div>
                            <button type="submit" class="auth-submit-btn">Login</button>
                        </form>
                        <div class="auth-footer">
                            <p>Don't have an account? <a href="#" id="switchToSignup" class="auth-link">Sign up here</a></p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', loginModalHTML);
    }
    
    // Create Sign-up Modal
    if (!document.getElementById('signupModal')) {
        const signupModalHTML = `
            <div id="signupModal" class="auth-modal" style="display: none;">
                <div class="auth-modal-content">
                    <div class="auth-modal-header">
                        <h2>📝 Sign Up for Rabbit's Home</h2>
                        <button class="auth-close-btn">&times;</button>
                    </div>
                    <div class="auth-modal-body">
                        <form id="signupForm">
                            <div class="form-group">
                                <label>👤 Full Name</label>
                                <input type="text" id="signupName" placeholder="Enter your full name" required>
                            </div>
                            <div class="form-group">
                                <label>📧 Email Address</label>
                                <input type="email" id="signupEmail" placeholder="Enter your email" required>
                            </div>
                            <div class="form-group">
                                <label>🔒 Password</label>
                                <input type="password" id="signupPassword" placeholder="Create a password" required>
                            </div>
                            <div class="form-group">
                                <label>✅ Confirm Password</label>
                                <input type="password" id="signupConfirmPassword" placeholder="Confirm your password" required>
                            </div>
                            <button type="submit" class="auth-submit-btn">Sign Up</button>
                        </form>
                        <div class="auth-footer">
                            <p>Already have an account? <a href="#" id="switchToLogin" class="auth-link">Login here</a></p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', signupModalHTML);
    }
}

// display Login state
function showLoginModal() {
    const loginModal = document.getElementById('loginModal');
    if (loginModal) {
        loginModal.style.display = 'flex';
        // clear the form
        document.getElementById('loginForm').reset();
    }
}

// display Sign-up state
function showSignupModal() {
    const signupModal = document.getElementById('signupModal');
    if (signupModal) {
        signupModal.style.display = 'flex';
        // clear the form
        document.getElementById('signupForm').reset();
    }
}

// close the form
function closeAuthModal() {
    const loginModal = document.getElementById('loginModal');
    const signupModal = document.getElementById('signupModal');
    if (loginModal) loginModal.style.display = 'none';
    if (signupModal) signupModal.style.display = 'none';
}

// bind Login & Sign-up btn
function bindAuthButtons() {
    // create Login & Sign-up btn
    const loginBtn = document.querySelector('#btncolor:first-child');
    const signupBtn = document.querySelector('#btncolor:last-child');
    
    if (loginBtn) {
        const newLoginBtn = loginBtn.cloneNode(true);
        loginBtn.parentNode.replaceChild(newLoginBtn, loginBtn);
        newLoginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showLoginModal();
        });
    }
    
    if (signupBtn) {
        const newSignupBtn = signupBtn.cloneNode(true);
        signupBtn.parentNode.replaceChild(newSignupBtn, signupBtn);
        newSignupBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showSignupModal();
        });
    }
    
    // bind the close btn
    const closeBtns = document.querySelectorAll('.auth-close-btn');
    closeBtns.forEach(btn => {
        btn.addEventListener('click', closeAuthModal);
    });
    
    // click the backgroud to close the from
    const modals = document.querySelectorAll('.auth-modal');
    modals.forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeAuthModal();
            }
        });
    });
    
    // switch to Login / Sign-up link
    const switchToSignup = document.getElementById('switchToSignup');
    const switchToLogin = document.getElementById('switchToLogin');
    
    if (switchToSignup) {
        switchToSignup.addEventListener('click', (e) => {
            e.preventDefault();
            closeAuthModal();
            showSignupModal();
        });
    }
    
    if (switchToLogin) {
        switchToLogin.addEventListener('click', (e) => {
            e.preventDefault();
            closeAuthModal();
            showLoginModal();
        });
    }
    
    // Process Login form submissions
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            
            if (email && password) {
                // display welcome
                showToastMessage(`🎉 Welcome back! You've logged in as ${email}`);
                closeAuthModal();
                // clear the form
                loginForm.reset();
            } else {
                showToastMessage('⚠️ Please fill in all fields!', 'error');
            }
        });
    }
    
    // Process Sign-up form submissions
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('signupName').value;
            const email = document.getElementById('signupEmail').value;
            const password = document.getElementById('signupPassword').value;
            const confirmPassword = document.getElementById('signupConfirmPassword').value;
            
            if (!name || !email || !password || !confirmPassword) {
                showToastMessage('⚠️ Please fill in all fields!', 'error');
                return;
            }
            
            if (password !== confirmPassword) {
                showToastMessage('❌ Passwords do not match!', 'error');
                return;
            }
            
            if (password.length < 6) {
                showToastMessage('🔒 Password must be at least 6 characters!', 'error');
                return;
            }
            
            // display successfull
            showToastMessage(`🎉 Welcome ${name}! You've successfully signed up with ${email}`);
            closeAuthModal();
            // clear the form
            signupForm.reset();
        });
    }
}

// display noti
function showToastMessage(message, type = 'success') {
    let toast = document.getElementById('addToast');
    
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'toast-feedback';
        document.body.appendChild(toast);
    }
    
    toast.textContent = message;
    toast.classList.add('show-toast');
    
    setTimeout(() => {
        toast.classList.remove('show-toast');
    }, 2500);
}


// set default
function initCart() {
    initDOMElements();
    createAuthModals();
    bindAuthButtons();
    bindBuyButtons();
    bindViewButtons();
    bindCartFloatEvent();
    bindOutsideClick();
    renderCartSidebar();
}

// default after the page has fully loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCart);
} else {
    initCart();
}

