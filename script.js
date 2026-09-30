const API_BASE = window.location.port === "3000" || window.location.hostname === "localhost"
  ? `${window.location.origin}/api`
  : "http://localhost:3000/api";

const IMAGE_BASE = API_BASE.replace(/\/api$/, "");

const navToggle = document.getElementById("navToggle");
const navLinks = document.getElementById("navLinks");
const contactForm = document.getElementById("contactForm");
const formNote = document.getElementById("formNote");
const productList = document.getElementById("productList");
const productSelect = document.getElementById("productSelect");
const productFilters = document.getElementById("productFilters");
const currentPage = document.body.dataset.page || "home";

let products = [];

const fallbackImages = [
  "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1613665813446-82a78c468a1d?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1559302504-64aae6ca6b6d?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1497440001374-f26997328c1b?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&w=400&q=80",
];

function starsFromRating(rating) {
  const value = Number(rating);
  if (value >= 4.8) return "★★★★★";
  if (value >= 4.3) return "★★★★☆";
  return "★★★★☆";
}

function productImage(product, index) {
  if (!product.image) return fallbackImages[index % fallbackImages.length];
  if (product.image.startsWith("http")) return product.image;
  return `${IMAGE_BASE}${product.image}`;
}

function createProductCard(product, index) {
  const article = document.createElement("article");
  article.className = "product" + (product.featured ? " featured" : "");
  article.dataset.category = product.category;

  const badge = product.featured ? `<span class="badge">Best Seller</span>` : "";
  const qty = product.qty ?? product.quantity ?? 0;
  const desc = product.desc || product.description || "";

  article.innerHTML = `
    ${badge}
    <div class="product-visual">
      <img src="${productImage(product, index)}" alt="${product.name}" loading="lazy" />
    </div>
    <div class="product-body">
      <div class="product-top">
        <h3>${product.name}</h3>
        <div class="product-rating">
          <span class="stars" aria-hidden="true">${starsFromRating(product.rating)}</span>
          <span>${product.rating} · ${product.reviews} reviews</span>
        </div>
      </div>
      <p class="product-desc">${desc}</p>
      <div class="product-meta">
        <div class="meta-item">
          <span class="meta-label">Price</span>
          <span class="meta-value">${product.price}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Quantity</span>
          <span class="meta-value">${qty} in stock</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Warranty</span>
          <span class="meta-value">${product.warranty}</span>
        </div>
      </div>
    </div>
    <a href="contact.html?product=${encodeURIComponent(product.name)}" class="btn btn-primary btn-sm">Order Now</a>
  `;

  return article;
}

function renderProducts(filter = "all") {
  if (!productList) return;
  productList.innerHTML = "";

  const list = products.filter((p) => filter === "all" || p.category === filter);
  if (!list.length) {
    productList.innerHTML = `<p class="section-lead">Is category mein abhi koi product nahi. Admin panel se upload karein.</p>`;
    return;
  }

  list.forEach((product, index) => {
    productList.appendChild(createProductCard(product, index));
  });

  productList.querySelectorAll(".product").forEach((el) => {
    requestAnimationFrame(() => el.classList.add("visible"));
  });
}

function fillProductSelect() {
  if (!productSelect) return;

  productSelect.innerHTML = "";
  const custom = document.createElement("option");
  custom.value = "Custom Quote";
  custom.textContent = "Custom Quote";
  productSelect.appendChild(custom);

  products.forEach((product) => {
    const option = document.createElement("option");
    option.value = product.name;
    option.textContent = product.name;
    productSelect.appendChild(option);
  });

  const params = new URLSearchParams(window.location.search);
  const selected = params.get("product");
  if (selected && products.some((p) => p.name === selected)) {
    productSelect.value = selected;
  } else if (products.some((p) => p.name === "Family Pro 5kW")) {
    productSelect.value = "Family Pro 5kW";
  }
}

function markActiveNav() {
  document.querySelectorAll("[data-nav]").forEach((link) => {
    if (link.dataset.nav === currentPage) {
      link.classList.add("active-link");
    }
  });
}

async function loadProductsFromApi() {
  try {
    const res = await fetch(`${API_BASE}/products`);
    if (!res.ok) throw new Error("API not ready");
    products = await res.json();
  } catch (err) {
    console.warn("Backend API offline. Start backend with: cd backend && npm start", err);
    if (productList) {
      productList.innerHTML = `
        <p class="section-lead">
          Backend band hai. Products dekhne ke liye pehle server chalayein:<br />
          <code>cd backend</code> phir <code>npm start</code><br />
          Phir open karein: <a href="http://localhost:3000/products.html">http://localhost:3000/products.html</a>
        </p>`;
    }
    return false;
  }
  return true;
}

if (navToggle && navLinks) {
  navToggle.addEventListener("click", () => {
    navToggle.classList.toggle("open");
    navLinks.classList.toggle("open");
  });

  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navToggle.classList.remove("open");
      navLinks.classList.remove("open");
    });
  });
}

if (productFilters) {
  productFilters.addEventListener("click", (e) => {
    const btn = e.target.closest(".filter-btn");
    if (!btn) return;
    productFilters.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    renderProducts(btn.dataset.filter);
  });
}

if (contactForm && formNote) {
  contactForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(contactForm);
    const payload = {
      name: fd.get("name"),
      phone: fd.get("phone"),
      product: fd.get("product"),
      message: fd.get("message") || "",
    };

    try {
      const res = await fetch(`${API_BASE}/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed");
      formNote.textContent = "Thanks! Message save ho gaya. Shoukat Ali jaldi reply karenge — 0304 437 1110";
      formNote.hidden = false;
      contactForm.reset();
      fillProductSelect();
    } catch {
      formNote.textContent = "Thanks! Call/WhatsApp Shoukat Ali on 0304 437 1110 (backend offline — message local only).";
      formNote.hidden = false;
    }
  });
}

markActiveNav();

(async function init() {
  const ok = await loadProductsFromApi();
  if (!ok) return;
  fillProductSelect();
  renderProducts("all");
})();
