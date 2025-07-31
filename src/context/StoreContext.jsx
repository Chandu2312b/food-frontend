import { createContext, useEffect, useState } from "react";
// import { food_list } from "../assets/assets";
export const StoreContext = createContext(null);
import axios from "axios";

const StoreContextProvider = (props) => {
  // This is the context provider for the store
  // It provides the food_list to the rest of the application

  const [cartItems, setCartItems] = useState({});
  // const url ="http://localhost:4000"
  const url = "https://food-backend-defr.onrender.com"



  const [token,setToken] = useState("");
  const [food_list,setFoodList] =useState([])

  const addToCart = async (itemId) => {
    if (!cartItems[itemId]) {
      setCartItems((prev) => ({ ...prev, [itemId]: 1 }));
    } else {
      setCartItems((prev) => ({ ...prev, [itemId]: prev[itemId] + 1 }));
    }
    if(token){
      try {
        await axios.post(url+"/api/cart/add",{itemId},{headers:{token}})
      } catch (error) {
        console.error("Failed to add item to cart:", error)
      }
    }
  };
  const removeFromCart = async (itemId) => {
    setCartItems((prev) => ({ ...prev, [itemId]: prev[itemId] - 1 }));
    if(token){
      try {
        await axios.post(url+"/api/cart/remove",{itemId},{headers:{token}})
      } catch (error) {
        console.error("Failed to remove item from cart:", error)
      }
    }
  };
  const getTotalCartAmount = () => {
    let totalAmount = 0;
    for (const item in cartItems) {
      if (cartItems[item] > 0) {
        let itemInfo = food_list.find((product) => product._id === item);
        if (itemInfo && itemInfo.price) {
          totalAmount += itemInfo.price * cartItems[item];
        }
      }
    }
    return totalAmount;
  };

  const fetchFoodList = async ()=>{
    try {
      const response = await axios.get(url+"/api/food/list")
      setFoodList(response.data.data)
    } catch (error) {
      console.error("Failed to fetch food list:", error)
      setFoodList([]) // Set empty array as fallback
    }
  }
  const loadCartData = async (token) =>{
    try {
      const response = await axios.post(url+"/api/cart/get",{},{headers:{token}});
      setCartItems(response.data.cartData);
    } catch (error) {
      console.error("Failed to load cart data:", error)
      setCartItems({}) // Set empty object as fallback
    }
  }

   useEffect(()=>{
    
    async function loadData(){
      try {
        await fetchFoodList();
        if (localStorage.getItem("token")){
          setToken(localStorage.getItem("token"));
          await loadCartData(localStorage.getItem("token"));
        }
      } catch (error) {
        console.error("Failed to load initial data:", error)
      }
    }
    loadData();
   },[])

  const contextValue = {
    food_list,
    cartItems,
    setCartItems,
    addToCart,
    removeFromCart,
    getTotalCartAmount,
    url,
    token,
    setToken
  };

  return (
    <StoreContext.Provider value={contextValue}>
      {props.children}
    </StoreContext.Provider>
  );
};
export default StoreContextProvider;
