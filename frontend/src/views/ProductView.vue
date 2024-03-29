<script setup>
import { ref, computed, watchEffect } from "vue";
import { useRoute, useRouter, RouterLink } from "vue-router";
import { useAuthStore } from "../store/auth";

const { isAuthenticated, isAdmin, userData, token } = useAuthStore();

const route = useRoute();
const router = useRouter();

const productId = ref(route.params.productId);
const product = ref();
const loading = ref(true);
const error = ref(false);
const isOwner = ref(false);
const price = ref(0);
const bids = ref([]);
const noBids = ref(true);
const showOffer = ref(false);
const deleteBtn = ref(false);

function verifyShowOffer() {
  const user = product.value.seller;
  if (useAuthStore().userData.value.id === user.id) {
    showOffer.value = false;
  } else {
    showOffer.value = true;
  }
}

function verifyBtnDelete() {
  const user = product.value.seller;
  if (
    useAuthStore().userData.value.id === user.id ||
    useAuthStore().userData.value.admin === true
  ) {
    deleteBtn.value = true;
  } else {
    deleteBtn.value = false;
  }
}

async function fetchProduct() {
  try {
    const response = await fetch(
      `http://localhost:3000/api/products/${productId.value}`,
    );
    if (response.ok) {
      const data = await response.json();
      product.value = data;
      bids.value = product.value.bids;
      if (bids.value.length > 0) {
        noBids.value = false;
      }
      loading.value = false;
      error.value = false;
      verifyShowOffer();
      verifyBtnDelete();
      if (
        isAuthenticated.value &&
        userData.value.id === product.value.sellerId
      ) {
        isOwner.value = true;
      }
    } else if (response.status === 404) {
      error.value = true;
      loading.value = false;
    } else {
      error.value = true;
      loading.value = false;
    }
  } catch (e) {
    console.error(e);
    error.value = true;
    loading.value = false;
  }
}

async function deleteBids(bidId) {
  error.value = false;
  loading.value = true;
  try {
    await fetch(`http://localhost:3000/api/bids/${bidId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token.value}`,
      },
    });
    await router.push({
      name: "Home",
    });
  } catch (e) {
    error.value = true;
  } finally {
    loading.value = false;
  }
}

async function addBid() {
  try {
    const res = await fetch(
      `http://localhost:3000/api/products/${productId.value}/bids`,
      {
        method: "POST",
        body: JSON.stringify({ price: price.value }),
        headers: {
          Authorization: `Bearer ${token.value}`,
          "Content-Type": "application/json",
        },
      },
    );
    fetchProduct();
  } catch (e) {
    error.value = true;
  }
}

const countdown = computed(() => {
  const end = new Date(product.value.endDate);
  const now = new Date();
  const diff = end.getTime() - now.getTime();

  if (diff <= 0) {
    return "Terminé";
  }

  const seconds = Math.floor(diff / 1000) % 60;
  const minutes = Math.floor(diff / 1000 / 60) % 60;
  const hours = Math.floor(diff / 1000 / 60 / 60) % 24;
  const days = Math.floor(diff / 1000 / 60 / 60 / 24);

  return `${days}j ${hours}h ${minutes}min ${seconds}s`;
});

fetchProduct();
/**
 * @param {number|string|Date|VarDate} date
 */
function formatDate(date) {
  const options = { year: "numeric", month: "long", day: "numeric" };
  return new Date(date).toLocaleDateString("fr-FR", options);
}
</script>

<template>
  <div class="row">
    <div class="text-center mt-4" v-if="loading" data-test-loading>
      <div class="spinner-border" role="status">
        <span class="visually-hidden">Chargement...</span>
      </div>
    </div>

    <div
      class="alert alert-danger mt-4"
      role="alert"
      v-if="error"
      data-test-error
    >
      Une erreur est survenue lors du chargement des produits.
    </div>
    <div v-if="product" class="row" data-test-product>
      <!-- Colonne de gauche : image et compte à rebours -->
      <div class="col-lg-4">
        <img
          :src="product.pictureUrl"
          alt=""
          class="img-fluid rounded mb-3"
          data-test-product-picture
        />
        <div class="card">
          <div class="card-header">
            <h5 class="card-title">Compte à rebours</h5>
          </div>
          <div class="card-body">
            <h6 class="card-subtitle mb-2 text-muted" data-test-countdown>
              Temps restant : {{ countdown }}
            </h6>
          </div>
        </div>
      </div>

      <!-- Colonne de droite : informations du produit et formulaire d'enchère -->
      <div class="col-lg-8">
        <div class="row">
          <div class="col-lg-6">
            <h1 class="mb-3" data-test-product-name>
              {{ product.name }}
            </h1>
          </div>
          <div class="col-lg-6 text-end">
            <RouterLink
              :to="{
                name: 'ProductEdition',
                params: { productId: product.id },
              }"
              class="btn btn-primary"
              data-test-edit-product
            >
              Editer
            </RouterLink>
            &nbsp;
            <button class="btn btn-danger" data-test-delete-product>
              Supprimer
            </button>
          </div>
        </div>

        <h2 class="mb-3">Description</h2>
        <p data-test-product-description>
          {{ product.description }}
        </p>

        <h2 class="mb-3">Informations sur l'enchère</h2>
        <ul>
          <li data-test-product-price>
            Prix de départ : {{ product.originalPrice }} €
          </li>
          <li data-test-product-end-date>
            Date de fin : {{ formatDate(product.endDate) }}
          </li>
          <li>
            Vendeur :
            <router-link
              :to="{ name: 'User', params: { userId: product.sellerId } }"
              data-test-product-seller
            >
              {{ product.seller.username }}
            </router-link>
          </li>
        </ul>

        <h2 class="mb-3">Offres sur le produit</h2>
        <table class="table table-striped" data-test-bids>
          <thead>
            <tr>
              <th scope="col">Enchérisseur</th>
              <th scope="col">Offre</th>
              <th scope="col">Date</th>
              <th scope="col"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="bid in bids.values()" :key="bid.id" data-test-bid>
              <td>
                <router-link
                  :to="{ name: 'User', params: { userId: bid.bidder.id } }"
                  data-test-bid-bidder
                >
                  {{ bid.bidder.username }}
                </router-link>
              </td>
              <td data-test-bid-price>{{ bid.price }} €</td>
              <td data-test-bid-date>
                {{ new Date(bid.date).toLocaleDateString() }}
              </td>
              <td>
                <button
                  v-if="deleteBtn"
                  class="btn btn-danger btn-sm"
                  data-test-delete-bid
                  @click="deleteBids(bid.id)"
                >
                  Supprimer
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <p v-if="noBids" data-test-no-bids>Aucune offre pour le moment</p>

        <form v-if="showOffer" data-test-bid-form>
          <div class="form-group">
            <label for="bidAmount">Votre offre :</label>
            <input
              type="number"
              class="form-control"
              id="bidAmount"
              data-test-bid-form-price
            />
            <small class="form-text text-muted">
              Le montant doit être supérieur à 10 €.
            </small>
          </div>
          <button
            type="submit"
            class="btn btn-primary"
            disabled
            data-test-submit-bid
          >
            Enchérir
          </button>
        </form>
      </div>
    </div>
  </div>
</template>
