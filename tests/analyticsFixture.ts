export function analyticsFixture() {
  const now=new Date().toISOString();
  const findings=[{kind:'FACT',title:'Payment failure observed',evidence:'1 affected session; no verified purchase for that session.',severity:'High',confidence:'High',action:'Inspect the failing payment attempt.',verification:'Repeat checkout and confirm a server order event.',score:80}];
  const names=['Landing','Products','Cart','Checkout','Order'];
  const counts=[4,3,3,2,1];
  const funnel=names.map((stage,i)=>({stage,sessions:counts[i],users:counts[i],events:counts[i],conversion_percent:counts[i]/4*100,previous_step_conversion_percent:i?counts[i]/counts[i-1]*100:null,drop_off_percent:i?(1-counts[i]/counts[i-1])*100:null,average_seconds_to_next:2}));
  const group=[{name:'facebook',sessions:4,product_viewers:3,cart:3,checkout:2,orders:1,conversion_percent:25,errors:2,high_intent:3}];
  const sessions=['Ordered','Checkout abandoned','Ended','Cart abandoned'].map((status,i)=>({id:`00000000-0000-4000-8000-00000000000${i+1}`,source:'facebook',campaign:'Burger campaign',device:'MOBILE',browser:'Chrome',status,cart_value:i===2?0:200,last_step:i===1?'payment_failed':i===3?'delivery_area_failed':i===0?'order_success':'product_view',reason:i===1?'payment_failed':i===3?'delivery_area_failed':'Reason unknown',first_seen:now,last_seen:now,duration_seconds:30,first_touch:{utm_source:'facebook'},session_touch:{utm_source:'facebook'},last_touch:{utm_source:'facebook'}}));
  return {id:'report-1',status:'READY',data:{generated_at:now,scope_note:'Sessions starting in the selected Nepal-time range.',truncated:false,
    executive:{sessions:4,visitors:4,cart:3,checkout:2,orders:1,revenue:200,conversion_percent:25,clicks:null,impressions:null,spend:null,cost_per_order:null},
    diagnosis:findings,core_funnel:funnel,funnel,bottleneck:null,
    reconciliation:{scope:'All website orders in the selected date range.',database_orders:1,analytics_purchases:1,verified_paid_orders:1,missing_purchase_tracking:0},
    groups:{source:group,campaign:group,ad:group,adset:group,intent:group,device:group,browser:group,os:group,location:group,returning:[]},
    sessions,session_count:4,abandoned:[sessions[1],sessions[3]],errors:[{event:'payment_failed',category:'provider_declined',endpoint:'/customer/checkout/',events:1,affected_sessions:1,session_ids:[sessions[1].id],cart_value_at_risk:200}],
    products:[{name:'Burger',view:3,cart:2,checkout:2,purchase:1,cart_rate:66.67,purchase_rate:33.33,revenue_before_discounts:200}],
    paths:[{path:'facebook → /menu → add_to_cart → checkout_start',sessions:2,percent:50}],hourly:[{hour:12,sessions:4,cart:3,orders:1}],
    cart_bands:[{band:'200–400',cart_sessions:3,ended_sessions:3,abandoned:2,abandonment_percent:66.67}],delivery_fees:{exposed_sessions:0,abandoned_after_exposure:0,interpretation:'Not implemented by current checkout.'},
    checkout_fields:[{step:'checkout_start',sessions:2},{step:'order_success',sessions:1}],payments:[],ads:[],performance:[],
    tracking_health:[{event:'order_success',events:1,status:'Observed'}],limitations:['No replay provider is configured.'],duplicates:[],
    baseline:{sessions:0,conversion_percent:null,significant_decline:false,method:'Insufficient prior data.'}}};
}
