<script setup>
import { useAuthStore } from "../store/auth";
import { useRoute, useRouter } from "vue-router";
import { ref } from "vue";

const { isAuthenticated, token } = useAuthStore();
const router = useRouter();
const route = useRoute();
const loading = ref(false);
const error = ref(false);
const product = ref("");

if (!isAuthenticated.value) {
  router.push({ name: "Login" });
}

const productId = ref(route.params.productId);

async function fetchProduct() {
  loading.value = true;
  error.value = false;

  try {
    const response = await fetch(
      "http://localhost:3000/api/products/" + productId.value,
    );
    if (!response.ok) {
      throw new Error("Erreur lors de la récupération des produits");
    }
    product.value = await response.json();
    console.log(product.value);
    product.value.endDate = new Date(product.value.endDate)
      .toISOString()
      .split("T")[0];
  } catch (e) {
    console.error("Erreur lors de la récupération du produit:", e);
    error.value = true;
  } finally {
    loading.value = false;
  }
}
fetchProduct();
</script>

<template>
  <h1 class="text-center">Modifier un produit</h1>

  <div class="row justify-content-center">
    <div class="col-md-6">
      <form>
        <div
          v-if="error"
          class="alert alert-danger mt-4"
          role="alert"
          data-test-error
        >
          Une erreur est survenue
        </div>

        <div class="mb-3">
          <label for="product-name" class="form-label"> Nom du produit </label>
          <input
            type="text"
            class="form-control"
            id="product-name"
            required
            data-test-product-name
            v-model="product.name"
          />
        </div>

        <div class="mb-3">
          <label for="product-description" class="form-label">
            Description
          </label>
          <textarea
            class="form-control"
            id="product-description"
            name="description"
            rows="3"
            required
            data-test-product-description
            v-model="product.description"
          ></textarea>
        </div>

        <div class="mb-3">
          <label for="product-category" class="form-label"> Catégorie </label>
          <input
            type="text"
            class="form-control"
            id="product-category"
            required
            data-test-product-category
            v-model="product.category"
          />
        </div>

        <div class="mb-3">
          <label for="product-original-price" class="form-label">
            Prix de départ
          </label>
          <div class="input-group">
            <input
              type="number"
              class="form-control"
              id="product-original-price"
              name="originalPrice"
              step="1"
              min="0"
              required
              data-test-product-price
              v-model="product.originalPrice"
            />
            <span class="input-group-text">€</span>
          </div>
        </div>

        <div class="mb-3">
          <label for="product-picture-url" class="form-label">
            URL de l'image
          </label>
          <input
            type="url"
            class="form-control"
            id="product-picture-url"
            name="pictureUrl"
            required
            data-test-product-picture
            v-model="product.pictureUrl"
          />
        </div>

        <div class="mb-3">
          <label for="product-end-date" class="form-label">
            Date de fin de l'enchère
          </label>
          <input
            type="date"
            class="form-control"
            id="product-end-date"
            name="endDate"
            required
            data-test-product-end-date
            v-model="product.endDate"
          />
        </div>

        <div class="d-grid gap-2">
          <button type="submit" class="btn btn-primary" data-test-submit>
            Modifier le produit
            <span
              v-if="loading"
              class="spinner-border spinner-border-sm"
              role="status"
              aria-hidden="true"
              data-test-spinner
            ></span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
