<script setup>
import { ref, computed } from "vue";

const loading = ref(false);
const error = ref(false);
const products = ref([]);
let searchQuery = ref("");
let sortOption = ref("nom");

async function fetchProducts() {
  loading.value = true;
  error.value = false;

  try {
    const response = await fetch("http://localhost:3000/api/products");
    if (!response.ok) {
      throw new Error("Erreur lors de la récupération des produits");
    }
    const data = await response.json();
    if (!Array.isArray(data)) {
      throw new Error("Data received is not an array");
    }
    products.value = data;
  } catch (e) {
    console.error("Erreur lors de la récupération des produits:", e);
    error.value = true;
  } finally {
    loading.value = false;
  }
}
fetchProducts();

const searchedProducts = computed(() => {
  let sortedProducts = [...products.value];
  if (sortOption.value === "nom") {
    sortedProducts.sort((a, b) =>
      a.name.localeCompare(b.name, "fr", { ignorePunctuation: true }),
    ); // sort by name using localeCompare to handle accents and special characters
  } else if (sortOption.value === "prix") {
    sortedProducts.sort((a, b) => {
      const aPrice =
        new Date(a.endDate) > new Date()
          ? a.originalPrice
          : a.bids.length
            ? a.bids[a.bids.length - 1].price
            : a.originalPrice;
      const bPrice =
        new Date(b.endDate) > new Date()
          ? b.originalPrice
          : b.bids.length
            ? b.bids[b.bids.length - 1].price
            : b.originalPrice;
      return aPrice - bPrice;
    });
  }
  return sortedProducts.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.value.toLowerCase()),
  );
});
</script>

<template>
  <div>
    <h1 class="text-center mb-4">Liste des produits</h1>

    <div class="row mb-3">
      <div class="col-md-6">
        <form>
          <div class="input-group">
            <span class="input-group-text">Filtrage</span>
            <input
              type="text"
              class="form-control"
              placeholder="Filtrer par nom"
              data-test-filter
              v-model="searchQuery"
            />
          </div>
        </form>
      </div>
      <div class="col-md-6 text-end">
        <div class="btn-group">
          <button
            type="button"
            class="btn btn-primary dropdown-toggle"
            data-bs-toggle="dropdown"
            aria-expanded="false"
            data-test-sorter
          >
            Trier par {{ sortOption }}
          </button>
          <ul class="dropdown-menu dropdown-menu-end">
            <li>
              <a class="dropdown-item" href="#" @click="sortOption = 'nom'">
                Nom
              </a>
            </li>
            <li>
              <a
                class="dropdown-item"
                href="#"
                @click="sortOption = 'prix'"
                data-test-sorter-price
              >
                Prix
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <div v-if="loading" class="text-center mt-4" data-test-loading>
      <div class="spinner-border" role="status">
        <span class="visually-hidden">Chargement...</span>
      </div>
    </div>

    <div
      v-if="error"
      class="alert alert-danger mt-4"
      role="alert"
      data-test-error
    >
      Une erreur est survenue lors du chargement des produits.
    </div>

    <div class="row">
      <div
        class="col-md-4 mb-4"
        v-for="product in searchedProducts"
        :key="product.id"
        data-test-product
      >
        <div class="card">
          <router-link
            :to="{ name: 'Product', params: { productId: product.id } }"
          >
            <img
              :src="product.pictureUrl"
              data-test-product-picture
              class="card-img-top"
            />
          </router-link>
          <div class="card-body">
            <h5 class="card-title">
              <router-link
                :to="{ name: 'Product', params: { productId: product.id } }"
                data-test-product-name
              >
                {{ product.name }}
              </router-link>
            </h5>
            <p class="card-text" data-test-product-description>
              {{ product.description }}
            </p>
            <p class="card-text">
              Vendeur :
              <router-link
                :to="{ name: 'User', params: { userId: product.sellerId } }"
                data-test-product-seller
              >
                {{ product.seller.username }}
              </router-link>
            </p>
            <p class="card-text" data-test-product-date>
              En cours jusqu'au {{ product.endDate }}
            </p>
            <p class="card-text" data-test-product-price>
              Prix actuel : {{ product.originalPrice }} €
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
