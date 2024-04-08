<script setup>
import { ref, computed, reactive, onUnmounted } from "vue";
import { useRoute, useRouter, RouterLink } from "vue-router";
import { useAuthStore } from "../store/auth";

const { isAuthenticated, isAdmin, userData, token } = useAuthStore();

const state = reactive({
  countdown: "", // initial value
  intervalId: null,
});

async function waitForCountdown() {
  await new Promise((resolve) => {
    const intervalId = setInterval(() => {
      const countdownText = document.querySelector(
        "[data-test-countdown]",
      ).textContent;
      if (countdownText !== "") {
        clearInterval(intervalId);
        resolve();
      }
    }, 100);
  });
}

async function updateCountdown() {
  await waitForCountdown();

  console.log("updating countdown");

  if (!product.value) {
    state.countdown = "";
    return;
  }

  const endDate = new Date(product.value.endDate);
  const remainingTime = endDate - new Date();

  if (remainingTime <= 0) {
    state.countdown = "Terminé";
    clearInterval(state.intervalId);
    return;
  }

  const days = Math.floor(remainingTime / (1000 * 60 * 60 * 24));
  const hours = Math.floor(
    (remainingTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
  );
  const minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);

  state.countdown = `${days}j ${hours}h ${minutes}min ${seconds}s`;
  console.log("countdown value:", state.countdown);
}

state.intervalId = setTimeout(() => {
  updateCountdown();
  state.intervalId = setInterval(updateCountdown, 1000);
}, 500);

onUnmounted(() => {
  clearInterval(state.intervalId);
});

const route = useRoute();
const router = useRouter();

const productId = ref(route.params.productId);

const product = ref(null);
const seller = ref(null);
const loading = ref(false);
const error = ref(false);
const bidPrice = ref(null);
const maxBid = ref(0);
let form = ref(false);

async function fetchProduct() {
  loading.value = true;

  const str = "http://localhost:3000/api/products/" + productId.value;

  try {
    const response = await fetch(str);
    product.value = await response.json();

    for (let i = 0; i < product.value.bids.length; i++) {
      if (product.value.bids[i].price > maxBid.value) {
        maxBid.value = product.value.bids[i].price;
      }
    }
    bidPrice.value = maxBid.value + 1;
    const str2 = "http://localhost:3000/api/users/" + product.value.sellerId;
    const response2 = await fetch(str2);
    seller.value = await response2.json();

    loading.value = false;
  } catch (e) {
    error.value = true;
    console.log(e);
  } finally {
    loading.value = false;
  }

  if (
    userData &&
    userData.value &&
    userData.value.id &&
    product &&
    product.value &&
    product.value.sellerId &&
    userData.value.id !== product.value.sellerId
  ) {
    form.value = true;
  }
}

async function delBid(bidId) {
  console.log("rentrerFonction");

  const apiUrl = `http://localhost:3000/api/bids/${bidId}`;

  const requestOptions = {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token.value}`,
    },
  };

  fetch(apiUrl, requestOptions)
    .then((response) => {
      if (response.ok) {
        console.log("Enchère supprimée avec succès");
        for (let i = 0; i < product.value.bids.length; i++) {
          if (product.value.bids[i].id === bidId) {
            product.value.bids.splice(i, 1);
          }
        }
      } else {
        console.error("Erreur lors de la suppression de l'enchère");
      }
    })
    .catch((error) => {
      console.error("Erreur lors de la suppression de l'enchère", error);
    });
}

async function addBid() {
  const response = await fetch(
    `http://localhost:3000/api/products/${productId.value}/bids`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token.value}`,
      },
      body: JSON.stringify({
        price: bidPrice,
      }),
    },
  );
  if (response.ok) {
    console.log("ajout reussi");
  } else {
    console.log("fail");
    error.value = true;
  }
}

async function deleteProduct() {
  if (confirm("Êtes-vous sûr de vouloir supprimer ce produit ?")) {
    const apiUrl = "http://localhost:3000/api/products/";
    const requestOptions = {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token.value}`,
      },
    };

    fetch(apiUrl + productId.value, requestOptions)
      .then((response) => {
        if (response.ok) {
          console.log("Produit supprimé avec succès");
          router.push({ name: "Home" });
        } else {
          console.error("Erreur lors de la suppression du produit");
        }
      })
      .catch((error) => {
        console.error("Erreur lors de la suppression du produit", error);
      });
  }
}

fetchProduct();
</script>
<template>
  <div class="row">
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
    <div v-if="!loading && !error" class="row" data-test-product>
      <!-- Colonne de gauche : image et compte à rebours -->
      <div class="col-lg-4">
        <img
          v-bind:src="product.pictureUrl"
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
              Temps restant : {{ state.countdown }}
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
              v-if="
                isAuthenticated && (userData.id === product.sellerId || isAdmin)
              "
              :to="{ name: 'ProductEdition', params: { productId: productId } }"
              class="btn btn-primary"
              data-test-edit-product
            >
              Editer
            </RouterLink>
            &nbsp;
            <button
              v-if="
                isAuthenticated && (userData.id === product.sellerId || isAdmin)
              "
              class="btn btn-danger"
              data-test-delete-product
              @click="deleteProduct()"
            >
              Supprimer
            </button>
          </div>
        </div>

        <h2 class="mb-3">Description</h2>
        <p data-test-product-description>{{ product.description }}</p>

        <h2 class="mb-3">Informations sur l'enchère</h2>
        <ul>
          <li data-test-product-price>
            Prix de départ : {{ product.originalPrice }} €
          </li>
          <li id="end_date" data-test-product-end-date>
            Date de fin :
            {{
              new Date(product.endDate).toLocaleString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })
            }}
          </li>
          <li>
            Vendeur :
            <router-link
              :to="{ name: 'User', params: { userId: product.sellerId } }"
              data-test-product-seller
            >
              {{ seller.username }}
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
            <tr v-for="bid in product.bids" :key="bid.id" data-test-bid>
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
                {{
                  new Date(bid.date).toLocaleDateString("fr-FR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                }}
              </td>
              <td
                v-if="
                  isAdmin ||
                  (userData && userData.username === bid.bidder.username)
                "
              >
                <button
                  class="btn btn-danger btn-sm"
                  @click="delBid(bid.id)"
                  data-test-delete-bid
                >
                  Supprimer
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <p v-if="product.bids.length === 0" data-test-no-bids>
          Aucune offre pour le moment
        </p>

        <form v-if="form" data-test-bid-form>
          <div class="form-group">
            <label for="bidAmount">Votre offre :</label>
            <input
              type="number"
              class="form-control"
              id="bidAmount"
              v-model="bidPrice"
              data-test-bid-form-price
            />
            <small class="form-text text-muted">
              Le montant doit être supérieur à 10 €.
            </small>
          </div>
          <button
            type="submit"
            class="btn btn-primary"
            @click="addBid"
            v-bind:disabled="maxBid > bidPrice"
            data-test-submit-bid
          >
            Enchérir
          </button>
        </form>
      </div>
    </div>
  </div>
</template>
