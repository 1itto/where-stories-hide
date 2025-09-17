// Cart functionality
document.addEventListener('DOMContentLoaded', function() {
    loadCart();
    const cartCount = localStorage.getItem('cartCount') || 0;
    document.querySelector('.cart-count').textContent = cartCount;
});

function loadCart() {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
    document.querySelector('.cart-count').textContent = cartCount;

    if (cart.length === 0) return;

    let total = 0;
    let cartHTML = `
      <div class="cart-items">
        ${cart.map((item, index) => {
          const itemTotal = item.price * item.quantity;
          total += itemTotal;
          return `
            <div class="cart-item">
              <div class="cart-item-image">
                <i class="fas fa-book"></i>
              </div>
              <div class="cart-item-details">
                <h3 class="cart-item-title">${item.name}</h3>
                <p class="cart-item-price">$${item.price.toFixed(2)} each</p>
              </div>
              <div class="cart-item-quantity">
                <button class="quantity-btn" onclick="changeQuantity(${index}, -1)">-</button>
                <span class="quantity-value">${item.quantity}</span>
                <button class="quantity-btn" onclick="changeQuantity(${index}, 1)">+</button>
              </div>
              <button class="cart-item-remove" onclick="removeFromCart(${index})">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          `;
        }).join('')}
      </div>
      <div class="cart-total">
        Total: $<span id="cart-total">${total.toFixed(2)}</span>
      </div>
      <div style="text-align: center;">
        <button class="btn" onclick="checkout()">Proceed to Checkout</button>
      </div>
    `;

    document.getElementById('cart-content').innerHTML = cartHTML;
}

function changeQuantity(index, delta) {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    cart[index].quantity += delta;

    if (cart[index].quantity <= 0) {
      cart.splice(index, 1);
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    loadCart();
}

function removeFromCart(index) {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(cart));
    loadCart();
}

function checkout() {
    alert('Checkout functionality would connect to payment processor');
}

function addToCart(name, price) {
    let cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingItem = cart.find(item => item.name === name);

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({
        name: name,
        price: price,
        quantity: 1
      });
    }

    localStorage.setItem('cart', JSON.stringify(cart));

    const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
    localStorage.setItem('cartCount', cartCount);
    document.querySelector('.cart-count').textContent = cartCount;

    alert(`Added ${name} to cart!`);
}

// Login functionality
const loginForm = document.getElementById('login-form');
if (loginForm) {
    const messageDiv = document.getElementById('login-message');
    const usernameMsg = document.getElementById('username-message');
    const passwordMsg = document.getElementById('password-message');

    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      messageDiv.textContent = '';
      messageDiv.classList.remove('error', 'success');
      usernameMsg.textContent = '';
      usernameMsg.classList.remove('error');
      passwordMsg.textContent = '';
      passwordMsg.classList.remove('error');

      const username = document.getElementById('login-username').value;
      const password = document.getElementById('login-password').value;

      try {
        const res = await fetch('/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });

        const data = await res.json();

        if (!res.ok) {
          if (data.error.includes('username')) {
            usernameMsg.textContent = '⚠ ' + data.error;
            usernameMsg.classList.add('error');
          } else if (data.error.includes('password')) {
            passwordMsg.textContent = '⚠ ' + data.error;
            passwordMsg.classList.add('error');
          } else {
            messageDiv.textContent = '⚠ ' + data.error;
            messageDiv.classList.add('error');
          }
        } else {
          messageDiv.textContent = '✔ ' + data.message;
          messageDiv.classList.add('success');
          loginForm.reset();

          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 1000);
        }

      } catch (err) {
        messageDiv.textContent = '⚠ Something went wrong!';
        messageDiv.classList.add('error');
      }
    });
}

// Signup functionality
const signupForm = document.getElementById('signup-form');
if (signupForm) {
    const messageDiv = document.getElementById('signup-message');
    const usernameMsg = document.getElementById('username-message');
    const passwordMsg = document.getElementById('password-message');

    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      messageDiv.textContent = '';
      messageDiv.classList.remove('error', 'success');
      usernameMsg.textContent = '';
      usernameMsg.classList.remove('error');
      passwordMsg.textContent = '';
      passwordMsg.classList.remove('error');

      const username = document.getElementById('signup-username').value;
      const password = document.getElementById('signup-password').value;

      try {
        const res = await fetch('/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });

        const data = await res.json();

        if (!res.ok) {
          if (data.error.includes('username')) {
            usernameMsg.textContent = '⚠ ' + data.error;
            usernameMsg.classList.add('error');
          } else if (data.error.includes('password')) {
            passwordMsg.textContent = '⚠ ' + data.error;
            passwordMsg.classList.add('error');
          } else {
            messageDiv.textContent = '⚠ ' + data.error;
            messageDiv.classList.add('error');
          }
        } else {
          messageDiv.textContent = '✔ ' + data.message;
          messageDiv.classList.add('success');
          signupForm.reset();
        }

      } catch (err) {
        messageDiv.textContent = '⚠ Something went wrong!';
        messageDiv.classList.add('error');
      }
    });
}
