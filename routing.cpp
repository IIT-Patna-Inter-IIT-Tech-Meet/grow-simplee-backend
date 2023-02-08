/*
 variable notations :
 n  => number of delivery points excluding warehouse. So total (n + 1) locations
 m  => number of delivery vehicles
 wid => index of warehouse
 cap => capacity of each vehicle
 t => (n + 1) x (n + 1) matrix. t[i][j] => time in seconds taken to reach location j from location i
 d => (n + 1) x (n + 1) matrix. d[i][j] => distance in meters taken to location j from location i
 edd => vector of (n + 1). edd[i] => deadline in seconds for location i
 vol => vector of (n + 1). vol[i] => volume for location i
 */




#include <bits/stdc++.h>
#define NINF -1000000000000000000
#define INF 1000000000000000000
#define FITCONST 1000000000000
#define int long long
#define nl cerr<<endl;
#define sp <<" "<<
using namespace std;

template<class T> using minpq = priority_queue<T,vector<T>,greater<T> >;        // minimum priority queue

int A,  // coefficient used in cost function to prioritise on time deliveries
maxv;   // maxvolume among all deliveries
int workwindow = 12 * 3600;     // number of working hours per day * seconds in an hour


// UTILITY FUNCTIONS
std::default_random_engine generator;
std::uniform_int_distribution<long> distribution(0,LONG_MAX);
int myrandom(){
        return distribution(generator);
}

void read(vector<vector<int>> &a,int N){
        a = vector<vector<int>> (N + 1,vector<int>(N+1));
        for(int i = 0;i <= N;i++){
                for(int j = 0;j <= N;j++){
                        cin >> a[i][j];
                }
        }
}
void read(vector<int> &a,int N){
        a.resize(N + 1);
        for(int i = 0;i <= N;i++){
                cin >> a[i];
        }
}

void print(vector<vector<int>> &a){
        for(auto &v:a){
                for(auto &j:v){
                        cerr << j <<" ";
                }
                nl;
        }
}
void print(vector<int> &v){
        for(auto &j:v){
                cerr << j <<" ";
        }
        nl;
}
void print(vector<vector<vector<int>>> &a){
        for(auto &v:a){
                cerr << "New rider : \n";
                print(v);
        }
}

// please set cost function as per your requirements
int costfunction(int missededd, // total number of missed on time deliveries
                 int tott,      // total time
                 int totd       // total distance
)
{
        return A * (missededd) + sqrt(tott * totd);
}

int costfunction(vector<int> &route,
                 vector<vector<int>> &t,
                 vector<vector<int>> &d,
                 vector<int> &edd,    // edd[i] => deadline for ith delivery
                 int n,      // number of delivery points
                 int wid,    // warehouse idx
                 int m // number of vehicles
)
{
        int missededd = 0, tott = 0, totd = 0, days = 0;
        for(int i = 0;i < route.size();i++){
                if(!i){
                        tott += t[wid][route[0]];
                        totd += d[wid][route[0]];
                }
                else{
                        tott += t[route[i - 1]][route[i]];
                        totd += d[route[i - 1]][route[i]];
                }
                if((tott - 1) / workwindow != days){
                        days++;
                        tott = days * workwindow;
                        if(route[i] != wid){
                                tott += t[route[i - 1]][route[i]];
                        }
                }
                if(route[i] != wid and edd[route[i]] < tott){
                        missededd++;
                }
        }
        return costfunction(missededd, tott, totd);
}

int costfunction(vector<vector<int>> &seq,
                 vector<vector<int>> &t,
                 vector<vector<int>> &d,
                 vector<int> &edd,    // edd[i] => deadline for ith delivery
                 vector<int> &vol,    // volume[i] => volume for ith delivery
                 int n,      // number of delivery points
                 int wid,    // warehouse idx
                 int m, // number of vehicles
                 int cap     // vehicle cap
)
{
        int missededd = 0, tott = 0, totd = 0;
        for(auto &v : seq){
                if(v.empty()){
                        continue;
                }
                int pretime = 0, predist = 0, days = 0;
                for(int i = 0;i < v.size();i++){
                        if(!i){
                                pretime += t[wid][v[0]];
                                predist += d[wid][v[0]];
                        }
                        else{
                                pretime += t[v[i - 1]][v[i]];
                                predist += d[v[i - 1]][v[i]];
                        }
                        if((pretime - 1) / workwindow != days){
                                days++;
                                pretime = days * workwindow;
                                if(v[i] != wid){
                                        pretime += t[v[i - 1]][v[i]];
                                }
                        }
                        if(v[i] != wid and edd[v[i]] < pretime){
                                missededd++;
                        }
                }
                pretime += t[v.back()][wid];
                predist += d[v.back()][wid];
                tott += pretime;
                totd += predist;
        }
        return costfunction(missededd,tott,totd);
}

// utility function used to analyse solution inside console
void evaluate(string approach,
              vector<vector<int>> &seq,
              vector<vector<int>> &t,
              vector<vector<int>> &d,
              vector<int> &edd,    // edd[i] => deadline for ith delivery
              vector<int> &vol,    // volume[i] => volume for ith delivery
              int n,      // number of delivery points
              int wid,    // warehouse idx
              int m, // number of vehicles
              int cap     // vehicle cap
)
{
        
        int missededd = 0, tott = 0, totd = 0;
        vector<int> missed;
        for(auto &v : seq){
                if(v.empty()){
                        continue;
                }
                int pretime = 0, predist = 0, days = 0;
                for(int i = 0;i < v.size();i++){
                        if(!i){
                                pretime += t[wid][v[0]];
                                predist += d[wid][v[0]];
                        }
                        else{
                                pretime += t[v[i - 1]][v[i]];
                                predist += d[v[i - 1]][v[i]];
                        }
                        if((pretime - 1) / workwindow != days){
                                days++;
                                pretime = days * workwindow;
                                if(v[i] != wid){
                                        pretime += t[v[i - 1]][v[i]];
                                }
                        }
                        if(v[i] != wid and edd[v[i]] < pretime){
                                missededd++;
                                missed.push_back(v[i]);
                        }
                }
                pretime += t[v.back()][wid];
                predist += d[v.back()][wid];
                tott += pretime;
                totd += predist;
        }
        for(auto j : missed){
                cout << j;nl;
        }
        cerr << approach;nl;
        cerr << "Missed EDD :" sp missededd sp "\nTotal time :" sp tott sp " seconds or " sp (tott / 3600.0) sp " hours" sp "\nTotal distance in km: " sp (totd / 1000.0) sp "Cost :" sp costfunction(missededd, tott, totd);nl;
        print(seq);
}


void evaluate(string approach,
              vector<vector<vector<int>>> &routes,
              vector<vector<int>> &t,
              vector<vector<int>> &d,
              vector<int> &edd,    // edd[i] => deadline for ith delivery
              vector<int> &vol,    // volume[i] => volume for ith delivery
              int n,      // number of delivery points
              int wid,    // warehouse idx
              int m, // number of vehicles
              int cap     // vehicle cap
)
{
        
        int missededd = 0, tott = 0, totd = 0;
        for(auto &riderroutes : routes){
                if(riderroutes.empty()){
                        continue;
                }
                for(int i = 0;i < riderroutes.size();i++){
                        int day = i + 1;
                        
                        auto &route = riderroutes[i];
                        if(route.empty()){
                                continue;
                        }
                        tott += t[wid][route[0]];
                        totd += d[wid][route[0]];
                        for(int j = 1;j < route.size();j++){
                                tott += t[route[j - 1]][route[j]];
                                totd += d[route[j - 1]][route[j]];
                                if(route[j] != wid and edd[route[j]] < day * workwindow){
                                        missededd++;
                                }
                        }
                        
                }
                
        }
        
        cerr << approach;nl;
        cerr << "Missed EDD :" sp missededd sp "\nTotal time :" sp tott sp " seconds or " sp (tott / 3600.0) sp " hours" sp "\nTotal distance in km: " sp (totd / 1000.0) sp "Cost :" sp costfunction(missededd, tott, totd);nl;
        print(routes);
}


vector<int> remove_wid(vector<int> route,int wid){
        vector<int> reroute;
        for(int i = 0;i < route.size();i++){
                if(route[i] != wid){
                        reroute.push_back(route[i]);
                }
        }
        return reroute;
}


// if at any point in route, the total volume of deliveries exceed, then the driver is routed back to warehouse to start with an empty bag
vector<int> handle_capacity(vector<int> route,
                            vector<int> &vol,    // volume[i] => volume for ith delivery
                            int n,      // number of delivery points
                            int wid,    // warehouse idx
                            int m, // number of vehicles
                            int cap     // vehicle cap
)
{
        vector<int> reroute;
        int sum = 0;
        for(auto j : route){
                if(j == wid){
                        sum = 0;
                }
                else{
                        sum += vol[j];
                }
                if(sum > cap){
                        sum = vol[j];
                        reroute.push_back(wid);
                }
                reroute.push_back(j);
        }
        return reroute;
}


// if at any point during the route, the total working time for the day exceeds working window, then it driver is routed back to warehouse. This marks the end of one working day
vector<int> handle_workwindow(vector<int> route,int wid,vector<vector<int>> &t){
        if(route.empty()){
                return route;
        }
        vector<int> reroute({route[0]});
        int tott = t[wid][route[0]], days = 0;
        for(int i = 1;i < route.size();i++){
                tott += t[route[i]][route[i - 1]];
                if((tott - 1) / workwindow != days){
                        days++;
                        if(reroute.back() != wid){
                                reroute.push_back(wid);
                        }
                        tott = days * workwindow + t[wid][route[i]];
                }
                if(route[i] == wid and reroute.back() == wid){
                        continue;
                }
                reroute.push_back(route[i]);
        }
        
        return reroute;
}


// routes driver back to warehouse incase the volume of deliveries exceed the vehicle capacity or working hours of driver exceeds workwindow limit
vector<int> handle_workandvol(vector<int> route,
                              vector<int> &vol,    // volume[i] => volume for ith delivery
                              vector<vector<int>> &t,
                              int n,      // number of delivery points
                              int wid,    // warehouse idx
                              int m, // number of vehicles
                              int cap     // vehicle cap
)
{
        if(route.empty()){
                return route;
        }
        if(maxv == 0){  // in case there is no volume constraint
                return handle_workwindow(route,wid,t);
        }
        vector<int> reroute({route[0]});
        int tott = t[wid][route[0]], totv = vol[route[0]], days = 0;
        
        for(int i = 1;i < route.size();i++){
                tott += t[route[i]][route[i - 1]];
                totv += vol[route[i]];
                if((tott - 1) / workwindow != days){    // extra day
                        days++;
                        reroute.push_back(wid);
                        tott = days * workwindow + t[wid][route[i]];
                        totv = vol[route[i]];
                }
                
                if(totv > cap){ // this if wont be triggered if above if is already triggered
                        reroute.push_back(wid);
                        tott -= t[route[i]][route[i - 1]];
                        tott += t[route[i - 1]][wid];
                        // maybe here day is over
                        if((tott - 1) / workwindow != days){
                                days++;
                                tott = t[wid][route[i]];
                        }
                        else{
                                tott += days * workwindow + t[wid][route[i]];
                        }
                        totv = vol[route[i]];
                }
                
                reroute.push_back(route[i]);
        }
        return reroute;
}

// fitness function of Genetic Algorithm
int get_fitness(vector<int> &seq,
                vector<vector<int>> &t,
                vector<vector<int>> &d,
                vector<int> &edd,    // edd[i] => deadline for ith delivery
                int n,      // number of delivery points
                int wid,    // warehouse idx
                int m // number of vehicles
)
{
        // fitness is inversely related to cost function
        return (INF / 1000) / costfunction(seq, t, d, edd, n, wid, m);
}

void mutate(vector<int> &seq){
        int l = myrandom() % seq.size(), r = myrandom() % seq.size();
        if(l > r){
                swap(l,r);
        }
        if(myrandom() % 2){     // one swap mutation
                swap(seq[l],seq[r]);
        }
        else{   // subarray reverse mutation
                reverse(seq.begin() + l,seq.begin() + r);
        }
}

// used to generate initial population from a seq for genetic algorithm
vector<vector<int>> genesis(vector<int> seq,
                            vector<vector<int>> &t,
                            vector<vector<int>> &d,
                            vector<int> &edd,    // edd[i] => deadline for ith delivery
                            int wid    // volume[i] => volume for ith delivery
)
{
        int lim = 3;
        vector<vector<int>> pop;
        reverse(seq.begin(),seq.end());
        pop.push_back(seq);
        reverse(seq.begin(),seq.end());
        
        
        for(int i = 1;i <= lim;i++){
                pop.emplace_back();
                for(auto j : seq){
                        pop.back().push_back(j);
                }
                mutate(seq);
        }
        
        reverse(seq.begin(),seq.end());
        for(int i = 1;i <= lim;i++){
                pop.emplace_back();
                for(auto j : seq){
                        pop.back().push_back(j);
                }
                mutate(seq);
        }
        reverse(seq.begin(),seq.end());
        
        vector<int> v;
        unordered_set<int> s(seq.begin(),seq.end());
        int last = wid;
        while(!s.empty()){
                pair<int,int> mn = {INF,-1};
                for(auto j : s){
                        if(t[last][j] < mn.first){
                                mn = {t[last][j],j};
                        }
                }
                v.push_back(mn.second);
                s.erase(mn.second);
                last = mn.second;
        }
        for(int i = 1;i <= lim;i++){
                pop.emplace_back();
                for(auto j : v){
                        pop.back().push_back(j);
                }
                mutate(v);
        }
        v.clear();
        
        s = unordered_set<int> (seq.begin(),seq.end());
        last = wid;
        while(!s.empty()){
                pair<int,int> mn = {INF,-1};
                for(auto j : s){
                        if(d[last][j] < mn.first){
                                mn = {d[last][j],j};
                        }
                }
                v.push_back(mn.second);
                s.erase(mn.second);
                last = mn.second;
        }
        for(int i = 1;i <= lim;i++){
                pop.push_back(v);
                mutate(v);
        }
        v.clear();
        
        s = unordered_set<int> (seq.begin(),seq.end());
        last = wid;
        while(!s.empty()){
                pair<int,int> mn = {INF,-1};
                for(auto j : s){
                        if(d[last][j] * t[last][j] < mn.first){
                                mn = {t[last][j] * d[last][j],j};
                        }
                }
                v.push_back(mn.second);
                s.erase(mn.second);
                last = mn.second;
        }
        for(int i = 1;i <= lim;i++){
                pop.emplace_back();
                for(auto j : v){
                        pop.back().push_back(j);
                }
                mutate(v);
        }
        v.clear();
        
        return pop;
}

int spin(vector<int> &roulette){        // spin function returns id as per weighted probability distribution. High fitness, high probability to get selected
        return upper_bound(roulette.begin(),roulette.end(),myrandom() % roulette.back()) - roulette.begin();
}

// greedy crossover
vector<int> HGreX_crossover(vector<int> &p1,
                            vector<int> &p2,
                            vector<vector<int>> &t,
                            vector<vector<int>> &d,
                            int wid
                            )
{
        vector<int> child;
        unordered_set<int> ids(p1.begin(),p1.end());
        map<int,vector<pair<int,int>>> s;
        for(int i = 1;i < p1.size();i++){
                s[p1[i - 1]].push_back({t[p1[i - 1]][p1[i]] * d[p1[i - 1]][p1[i]],p1[i]});
        }
        for(int i = 1;i < p2.size();i++){
                s[p2[i - 1]].push_back({t[p2[i - 1]][p2[i]] * d[p2[i - 1]][p2[i]],p2[i]});
        }
        
        
        child.push_back(p1[myrandom() % p1.size()]);
        ids.erase(child.back());
        while(!ids.empty()){
                pair<int,int> bestop = {-1,-1};
                for(auto p : s[child.back()]){
                        if(ids.count(p.second)){
                                bestop = max(bestop,p);
                        }
                }
                if(bestop.first == -1){
                        child.push_back(*ids.begin());
                }
                else{
                        child.push_back(bestop.second);
                }
                
                ids.erase(child.back());
        }
        
        return child;
}

// Alternating edge crossover
vector<int> AEX_crossover(vector<int> &p1,
                          vector<int> &p2,
                          int wid
                          )
{
        vector<int> child;
        unordered_set<int> ids(p1.begin(),p1.end());
        unordered_map<int,int> s[2];
        for(int i = 1;i < p1.size();i++){
                s[0][p1[i - 1]] = p1[i];
        }
        for(int i = 1;i < p2.size();i++){
                s[1][p2[i - 1]] = p2[i];
        }
        
        
        child.push_back(p1[myrandom() % p1.size()]);
        ids.erase(child.back());
        while(!ids.empty()){
                if(child.size() % 2 == 0){
                        if(s[0].count(child.back()) and ids.count(s[0][child.back()])){
                                child.push_back(s[0][child.back()]);
                        }
                        else{
                                child.push_back(*ids.begin());
                        }
                }
                else{
                        if(s[1].count(child.back()) and ids.count(s[1][child.back()])){
                                child.push_back(s[1][child.back()]);
                        }
                        else{
                                child.push_back(*ids.begin());
                        }
                }
                ids.erase(child.back());
        }
        
        return child;
}

// partition crossover variant
vector<int> PMX_crossover(vector<int> &p1,
                          vector<int> &p2,
                          int wid
                          )
{
        vector<int> child;
        unordered_set<int> ids(p1.begin(),p1.end());
        int l = myrandom() % p1.size(), r = myrandom() % p1.size();
        if(l > r){
                swap(l,r);
        }
        for(int i = l;i <= r;i++){
                ids.erase(p1[i]);
        }
        for(int i = 0;i < p2.size() and child.size() < l;i++){
                if(ids.count(p2[i])){
                        child.push_back(p2[i]);
                        ids.erase(p2[i]);
                }
        }
        for(int i = l;i <= r;i++){
                child.push_back(p1[i]);
        }
        for(int i = 0;i < p2.size();i++){
                if(ids.count(p2[i])){
                        child.push_back(p2[i]);
                        ids.erase(p2[i]);
                }
        }
        
        return child;
}


// Genetic Algorithm Optimiser
vector<int> GA_Optimise(vector<int> seq,
                        vector<vector<int>> &t,
                        vector<vector<int>> &d,
                        vector<int> &edd,    // edd[i] => deadline for ith delivery
                        vector<int> &vol,    // volume[i] => volume for ith delivery
                        int n,      // number of delivery points
                        int wid,    // warehouse idx
                        int m, // number of vehicles
                        int cap,     // vehicle cap
                        int generations
                        )
{
        // keep more diversity initially (to avoid premature convergence) using simulated annealing
        // initially favour tournament parent selection
        // later favour roulete selection
        // use AEX crossover for VRP or OX for TSP  https://hrcak.srce.hr/file/163313
        // better use mixed one
        
        seq = remove_wid(seq,wid);
        if(seq.size() < 2){
                return seq;
        }
        vector<vector<int>> pop = genesis(seq,t,d,edd,wid);
        int bestfitness = NINF, probability_scale = 1e18;
        
        vector<int> fittest, roulette;
        for(auto &seq : pop){
                
                int fitness = get_fitness(seq,t,d,edd,n,wid,m);
                if(roulette.empty()){
                        roulette.push_back(fitness);
                }
                else{
                        roulette.push_back(roulette.back() + fitness);
                }
                if(fitness > bestfitness){
                        fittest = seq;
                        bestfitness = fitness;
                }
        }
        
        for(int temperature = generations;temperature >= 0;temperature--){      // simulated annealing
                int p1 = 0,p2 = 0;      // parent1 , parent2
                // find theta = f(temp) such that initially it has tendency to be close to 1 but later to 0
                int theta = ((1.0 * temperature) / generations) * (myrandom() % probability_scale);
                if(theta >= probability_scale / 2){
                        // do random selection
                        p1 = myrandom() % pop.size();
                        p2 = myrandom() % pop.size();
                        
                }
                else{   // roulette selection
                        p1 = spin(roulette);
                        p2 = spin(roulette);
                        
                }
                
                vector<int> child;
                // do crossover
                switch(myrandom() % 3){
                        case 0 : child = HGreX_crossover(pop[p1],pop[p2],t,d,wid);
                                break;
                        case 1:
                                child = AEX_crossover(pop[p1],pop[p2],wid);
                                break;
                        case 2:
                                child = PMX_crossover(pop[p1],pop[p2],wid);
                                break;
                        default :
                                child = AEX_crossover(pop[p1],pop[p2],wid);
                };
                
                child = handle_workandvol(child, vol, t, n, wid, m, cap);
                int fitness = get_fitness(child,t,d,edd,n,wid,m);
                roulette.push_back(roulette.back() + fitness);
                child = remove_wid(child,wid);
                pop.push_back(child);
                if(fitness > bestfitness){
                        fittest = child;
                        bestfitness = fitness;
                }
                
                // do probab mutation on child
                if(myrandom() % 20 == 0){
                        mutate(child);
                        child = handle_workandvol(child, vol, t, n, wid, m, cap);
                        fitness = get_fitness(child,t,d,edd,n,wid,m);
                        child = remove_wid(child,wid);
                        roulette.push_back(roulette.back() + fitness);
                        pop.push_back(child);
                        if(fitness > bestfitness){
                                fittest = child;
                                bestfitness = fitness;
                        }
                }
                
        }
        return fittest;
}


// density based clustering
vector<vector<int>> get_clusters(vector<int> &starting_points,
                                 unordered_set<int> &rem,
                                 vector<vector<int>> &t,
                                 vector<vector<int>> &d,
                                 vector<int> &edd,    // edd[i] => deadline for ith delivery
                                 vector<int> &vol,    // volume[i] => volume for ith delivery
                                 int n,      // number of delivery points
                                 int wid,    // warehouse idx
                                 int m, // number of vehicles
                                 int cap     // vehicle cap
)
{
        unordered_map<int,int> cluster_number;
        vector<vector<int>> clusters;
        minpq<array<int,3>> q;
        for(auto j : starting_points){
                cluster_number[j] = clusters.size();
                clusters.push_back({j});
                rem.erase(j);
                for(auto nxt : rem){
                        q.push({t[j][nxt] * d[j][nxt],nxt,j});
                }
        }
        
        while(!rem.empty() and !q.empty()){
                auto [cost,cur,par] = q.top();
                q.pop();
                if(rem.count(cur) == 0){
                        continue;
                }
                clusters[cluster_number[par]].push_back(cur);
                cluster_number[cur] = cluster_number[par];
                rem.erase(cur);
                for(auto nxt : rem){
                        q.push({t[cur][nxt] * d[cur][nxt],nxt,cur});
                }
        }
        for(auto &cluster : clusters){
                if(cluster[0] == wid){
                        cluster.erase(cluster.begin());
                }
        }
        return clusters;
}


void euler_tour(int i,
                vector<vector<int>> &mst,
                unordered_set<int> &rem,
                vector<int> &tour,
                unordered_map<int,int> &p       // used to keep track of already travelled edges
)
{
        if(rem.count(i)){
                tour.push_back(i);
                rem.erase(i);
        }
        for(;p[i] < mst[i].size();){
                euler_tour(mst[i][p[i]++],mst,rem,tour,p);
        }
}

vector<int> christofides(
                         vector<int> cluster,
                         vector<vector<int>> &t,
                         vector<vector<int>> &d,
                         vector<int> &edd,    // edd[i] => deadline for ith delivery
                         vector<int> &vol,    // volume[i] => volume for ith delivery
                         int n,      // number of delivery points
                         int wid,    // warehouse idx
                         int cap     // vehicle cap
)
{
        if(cluster.size() <= 2){
                return cluster;
        }
        vector<vector<int>> mst(n + 1);
        unordered_set<int> rem;
        for(int i = 1;i < cluster.size();i++){
                rem.insert(cluster[i]);
        }
        minpq<array<int,3>> q;
        for(auto j : rem){
                q.push({t[cluster[0]][j] * d[cluster[0]][j],cluster[0],j});
        }
        while(!rem.empty() and !q.empty()){
                auto [dist,from,node] = q.top();
                q.pop();
                if(rem.count(node) == 0){
                        continue;
                }
                mst[from].push_back(node);
                mst[node].push_back(from);
                rem.erase(node);
                for(auto j : rem){
                        q.push({t[node][j] * d[node][j],node,j});
                }
        }
        unordered_set<int> odd_vertices;
        for(auto j : cluster){
                if(mst[j].size() % 2){
                        odd_vertices.insert(j);
                }
        }
        
        while(!odd_vertices.empty()){
                int u = *odd_vertices.begin();
                odd_vertices.erase(odd_vertices.begin());
                pair<int,int> best({INF,-1});
                for(auto v : odd_vertices){
                        if(t[u][v] * d[u][v] < best.first){
                                best = {t[u][v] * d[u][v],v};
                        }
                }
                int v = best.second;
                mst[u].push_back(v);
                mst[v].push_back(u);
                odd_vertices.erase(v);
        }
        
        vector<int> tour;
        rem = unordered_set<int> (cluster.begin(),cluster.end());
        unordered_map<int,int> p;
        euler_tour(cluster[0],mst,rem,tour,p);
        
        return tour;
}

vector<vector<int>> ray_finder(
                               vector<vector<int>> &t,
                               vector<vector<int>> &d,
                               vector<int> &edd,    // edd[i] => deadline for ith delivery
                               vector<int> &vol,    // volume[i] => volume for ith delivery
                               int n,      // number of delivery points
                               int wid,    // warehouse idx
                               int m, // number of vehicles
                               int cap     // vehicle cap
)
{
        vector<pair<int,int>> times;
        for(int i = 0;i < edd.size();i++){
                if(i == wid){
                        continue;
                }
                times.push_back({edd[i],i});
        }
        sort(times.begin(),times.end());
        
        vector<int> rushhour;   // make rush hour binary or linear
        if(n <= 200){
                for(int i = 0;i < times.size();i++){
                        rushhour.push_back(i);
                }
        }
        else{
                int s = (int)times.size() - 1;
                while(s){
                        rushhour.push_back(s);
                        s /= 2;
                }
                rushhour.push_back(0);
                reverse(rushhour.begin(),rushhour.end());
        }
        
        
        vector<vector<int>> best;
        int bestcost = INF;
        vector<vector<pair<int,int>>> partitions;
        int last_boundary = -1;
        for(auto boundary : rushhour){
                int start = last_boundary + 1;
                last_boundary = boundary;
                for(int i = start;i <= boundary;i++){
                        int id = i / m;
                        if(id >= partitions.size()){
                                partitions.emplace_back();
                        }
                        partitions.back().push_back(times[i]);
                }
                
                vector<vector<int>> seq(m);     // each sequence represents a ray
                
                // distribute among seq but time efficiently!
                // Complexity : (m * m) * (n / m)
                // m = n / 20
                for(int i = 0;i < partitions.size();i++){
                        if(i == 0){
                                for(int j = 0;j < partitions[i].size();j++){
                                        seq[j].push_back(partitions[i][j].second);
                                }
                        }
                        else{
                                unordered_set<int> rem;
                                for(int k = 0;k < m;k++){
                                        rem.insert(k);
                                }
                                for(auto [edd,j] : partitions[i]){
                                        pair<int,int> best = {INF,-1};
                                        for(auto k : rem){
                                                best = min(best,{d[seq[k].back()][j],k});
                                        }
                                        seq[best.second].push_back(j);
                                        rem.erase(best.second);
                                }
                        }
                }
                
                
                unordered_set<int> rem;
                for(int i = boundary + 1;i < times.size();i++){
                        rem.insert(times[i].second);
                }
                
                vector<int> starting_points;    // ending points of each ray serves as starting points of clusters
                for(auto &v : seq){
                        if(v.empty()){
                                starting_points.push_back(wid);
                        }
                        else{
                                starting_points.push_back(v.back());
                        }
                }
                
                vector<vector<int>> clusters = get_clusters(starting_points, rem, t, d, edd, vol, n, wid, m, cap);       // first points of each cluster is starting point and order of clusters in `clusters` is same as that of seq
                for(int i = 0;i < clusters.size();i++){
                        if(seq[i].empty() or clusters[i].empty()){
                                continue;
                        }
                        vector<int> route = christofides(clusters[i],t,d,edd,vol,n,wid,cap);
                        for(auto j : route){
                                if(!seq[i].empty() and j == seq[i].back()){
                                        continue;
                                }
                                seq[i].push_back(j);
                        }
                }
                
                for(auto &route : seq){
                        route = handle_workandvol(route, vol, t, n, wid, m, cap);
                }
                
                int cost = costfunction(seq, t, d, edd, vol, n, wid, m, cap);
                if(cost < bestcost){
                        bestcost = cost;
                        best = seq;
                }
        }
        for(auto &route : best){
                if(route.empty()){
                        continue;
                }
                route = GA_Optimise(route, t, d, edd, vol, n, wid, m, cap, max((int)100,(int)(1e6 / (n * n))));
                route = handle_workandvol(route, vol, t, n, wid, m, cap);
        }
        return best;
}


int cluster_id = 2;

class Cluster{
public:
        
        int id,parent,child1,child2;
        vector<int>nodes;
        
        Cluster(){
        }
        
        Cluster(int id,vector<int>&nodes,int parent=-1,int child1=-1, int child2=-1){
                this->id=id;
                this->nodes=nodes;
                this->parent=parent;
                this->child1=child1;
                this->child2=child2;
        }
        
        bool operator< (const Cluster &other) const {
                return id < other.id;
        }
        
};

int inner_distance(Cluster cluster,vector<vector<int>> &distance_matrix){
        int sum=0;
        for(int i=0;i<cluster.nodes.size();i++){
                for(int j=i+1;j<cluster.nodes.size();j++){
                        int t1=distance_matrix[cluster.nodes[i]][cluster.nodes[j]];
                        sum+=(t1*t1);
                }
        }
        return sum;
}
int cost(vector<int>&nodes,int i1,int i2,vector<vector<int>> &distance_matrix){
        int sum=0;
        for(int i=0;i<nodes.size();i++){
                int x=min(distance_matrix[nodes[i]][nodes[i1]],distance_matrix[nodes[i]][nodes[i2]]);
                sum+=(x*x);
        }
        return sum;
}

// Main k-medoid Fxn
pair<Cluster,Cluster> kmedoid(vector<vector<int>> &distance_matrix, Cluster &cluster){
        
        int iterations=min((int)500,(int)cluster.nodes.size());
        int sz=cluster.nodes.size();
        int i1=1+(rand()%(sz-1));
        int i2=1+(rand()%(sz-1));
        if(i1==i2){
                if(i1==0)
                        i1++;
                else
                        i1--;
        }
        
        int par=cluster.id;
        int c1_id=cluster_id++;
        int c2_id=cluster_id++;
        
        vector<int>nodes=cluster.nodes;
        vector<int>nodes1,nodes2;
        nodes1.push_back(nodes[i1]);
        nodes2.push_back(nodes[i2]);
        
        Cluster cluster1(c1_id,nodes1,par);
        Cluster cluster2(c2_id,nodes2,par);
        cluster.child1=cluster1.id;
        cluster.child2=cluster2.id;
        
        for(int i=0;i<nodes.size();i++){
                if(nodes[i]==nodes[i1] || nodes[i]==nodes[i2])
                        continue;
                if(distance_matrix[nodes[i]][nodes[i1]] < distance_matrix[nodes[i]][nodes[i2]])
                        cluster1.nodes.push_back(nodes[i]);
                else
                        cluster2.nodes.push_back(nodes[i]);
        }
        
        for(int i=0;i<iterations;i++){
                
                int new_id=1+(rand()%(sz-1));
                if(new_id==i1 || new_id==i2)
                        continue;
                int cost1=cost(nodes,i1,i2,distance_matrix);
                int cost2=cost(nodes,i1,new_id,distance_matrix);
                int cost3=cost(nodes,i2,new_id,distance_matrix);
                
                if(cost1<=cost2 && cost1<=cost3)
                        continue;
                else if(cost2<=cost1 && cost2<=cost3)
                        i2=new_id;
                else
                        i1=new_id;
                
                vector<int>nodes1,nodes2;
                nodes1.push_back(nodes[i1]);
                nodes2.push_back(nodes[i2]);
                
                cluster1.nodes=nodes1;
                cluster2.nodes=nodes2;
                
                for(int j=0;j<nodes.size();j++){
                        if(nodes[j]==nodes[i1] || nodes[j]==nodes[i2])
                                continue;
                        if(distance_matrix[nodes[j]][nodes[i1]] < distance_matrix[nodes[j]][nodes[i2]])
                                cluster1.nodes.push_back(nodes[j]);
                        else
                                cluster2.nodes.push_back(nodes[j]);
                }
        }
        
        return {cluster1,cluster2};
}

// Approach 3 Fxn
vector<vector<int>> approach3(vector<vector<int>> &distance_matrix,int k){     // k = no. of clusters
        
        int n=distance_matrix.size();
        vector<Cluster>cluster;                // currently undivided clusters - leaves of the hierarchial tree
        vector<Cluster>allClusters;            // all Clusters formed yet
        vector<int>temp;
        for(int i=0;i<n;i++)
                temp.push_back(i);
        
        Cluster clus(1,temp);
        cluster.push_back(clus);
        
        for(int i=0;i<k-1;i++){
                
                int max_dist=-1;
                
                vector<int>tx;
                Cluster curr_cluster(-1,tx);
                
                int count=0;
                int max_ind=0;
                for(auto c:cluster){
                        int dist=inner_distance(c,distance_matrix);
                        if(max_dist<dist){
                                max_dist=dist;
                                curr_cluster=c;
                                max_ind=count;
                        }
                        count+=1;
                }
                if(max_dist==0)
                        break;
                
                cluster.erase(cluster.begin()+max_ind);
                
                pair<Cluster,Cluster> p=kmedoid(distance_matrix,curr_cluster);
                Cluster clus1=p.first;
                Cluster clus2=p.second;
                
                allClusters.push_back(curr_cluster);
                cluster.push_back(clus1);
                cluster.push_back(clus2);
                
        }
        
        for(auto c:cluster)
                allClusters.push_back(c);
        
        vector<vector<int>>ans(allClusters.size());
        sort(allClusters.begin(),allClusters.end());
        
        for(auto c:cluster){
                int id=c.id;
                vector<int>temp;
                
                sort(c.nodes.begin(),c.nodes.end());
                for(auto node:c.nodes)
                        temp.push_back(node);
                if(temp.empty()){
                        continue;
                }
                ans.push_back(temp);
        }
        vector<vector<int>>ans2;
        for(int i=max((int)0,(int)ans.size()-k);i<ans.size();i++)
                ans2.push_back(ans[i]);
        return ans2;
}


vector<vector<int>> ap3(
                        vector<vector<int>> &t,
                        vector<vector<int>> &d,
                        vector<int> &edd,    // edd[i] => deadline for ith delivery
                        vector<int> &vol,    // volume[i] => volume for ith delivery
                        int n,      // number of delivery points
                        int wid,    // warehouse idx
                        int m, // number of vehicles
                        int cap     // vehicle cap
)
{
        
        vector<vector<int>> clusters(m);
        vector<vector<int>> dt = t;
        for(int i = 0;i < t.size();i++){
                for(int j = 0;j < t[i].size();j++){
                        dt[i][j] *= d[i][j];
                }
        }
        clusters = approach3(d,m);
        
        vector<vector<int>> best;
        for(int i = 0;i < clusters.size();i++){
                
                if(clusters[i].empty()){
                        continue;
                }
                vector<int> route = christofides(clusters[i],t,d,edd,vol,n,wid,cap);
                route = GA_Optimise(route, t, d, edd, vol, n, wid, m, cap, max((int)100,(int)(1e6 / (n * n))));
                route = handle_workandvol(route, vol, t, n, wid, m, cap);
                best.push_back(route);
        }
        
        return best;
}


// modified savings algo
vector<vector<int>> savings(
                            vector<vector<int>> &t,
                            vector<vector<int>> &d,
                            vector<int> &edd,    // edd[i] => deadline for ith delivery
                            vector<int> &vol,    // volume[i] => volume for ith delivery
                            int n,      // number of delivery points
                            int wid,    // warehouse idx
                            int m, // number of vehicles
                            int cap     // vehicle cap
)
{
        vector<vector<int>> seq;
        vector<int> missededd,       // total missed deliveries in seq i
        tott,        // total time taken in seq i
        totd,        // total distance in seq i
        totv;        // total volume in seq i
        int totaldistance = 0,      // total distance of all routes
        totaltime = 0,      // total time of all routes
        totalmissed = 0;    // total mimssed deliveries of all routes
        
        for(int i = 0;i <= n;i++){
                if(i == wid){
                        continue;
                }
                seq.push_back(vector<int>({i}));
                if(t[wid][i] > edd[i]){
                        missededd.push_back(1);
                }
                else{
                        missededd.push_back(0);
                }
                tott.push_back(t[wid][i] + t[i][wid]);
                totd.push_back(d[wid][i] + d[i][wid]);
                totv.push_back(vol[i]);
                totalmissed += missededd.back();
                totaldistance += totd.back();
                totaltime += tott.back();
        }
        
        // complexity = (n - m) x (n x n) x (logn) x HUGECONSTANT
        // 1000 x (allowed) x 10 = 1e7
        // allowed = 1e3
        // allowed iterations for k = 10
        while(seq.size() > m){
                //                cerr << seq.size();nl; // for debug
                array<int,5> mx({NINF,NINF,NINF,NINF,NINF});     // {max savings,src,target, src edge id, target edge id}
                int oldcost = costfunction(totalmissed,totaltime,totaldistance);
                
                vector<int> iops;
                for(int i = 0;i < seq.size();i++){
                        iops.push_back(i);
                }
                while(iops.size() > 25){
                        swap(iops.back(),iops[myrandom() % iops.size()]);
                        iops.pop_back();
                }
                for(auto i : iops){      // i => source
                        vector<int> jops;
                        for(int j = 0;j < seq.size();j++){
                                jops.push_back(j);
                        }
                        while(jops.size() > 25){
                                swap(jops.back(),jops[myrandom() % jops.size()]);
                                jops.pop_back();
                        }
                        for(auto j : jops){      // j => target
                                if(i == j){
                                        continue;
                                }
                                
                                // checking merge of i into j
                                vector<int> src = seq[i];
                                vector<int> target = seq[j];
                                
                                vector<int> kops;
                                for(int k = 0;k < src.size();k++){
                                        kops.push_back(k);
                                }
                                while(kops.size() > 15){
                                        swap(kops.back(),kops[myrandom() % kops.size()]);
                                        kops.pop_back();
                                }
                                
                                for(auto k : kops){      // amortization over all i,j,k,l => O(n^2) * max op cost
                                        // src starts with k, ends at k - 1
                                        
                                        int totsrctime = 0, totsrcd = 0, targetmissed = 0;
                                        for(int p = 1;p < src.size();p++){
                                                totsrctime += t[src[(k + p) % src.size()]][src[(k + p - 1) % src.size()]];
                                                totsrcd += d[src[(k + p) % src.size()]][src[(k + p - 1) % src.size()]];
                                        }
                                        
                                        // initially whole src is inserted before target[0] i.e. l = 0
                                        vector<int> istargetmissed(target.size());
                                        for(int p = 0,pretarget = t[wid][src[k]] + totsrctime + t[src[(k - 1 + src.size()) % src.size()]][target[0]];p < target.size();p++){
                                                if(p){
                                                        pretarget += t[target[p - 1]][target[p]];
                                                }
                                                if(pretarget > edd[target[p]]){
                                                        targetmissed++;
                                                        istargetmissed[p] = 1;
                                                }
                                        }
                                        
                                        vector<int> remtimesrc;
                                        for(int p = 0,presrc = 0;p < src.size();p++){
                                                remtimesrc.push_back(edd[src[(k + p) % src.size()]] - presrc);
                                                presrc += t[src[(k + p) % src.size()]][src[(k + p + 1) % src.size()]];
                                        }
                                        sort(remtimesrc.begin(),remtimesrc.end());      // nlogn
                                        
                                        
                                        // consider case when target size is 1 seperately ie l = 0
                                        // ... l = 0 begins
                                        int pre_src_overhead = t[wid][src[k]];
                                        
                                        int srcmissed = lower_bound(remtimesrc.begin(),remtimesrc.end(), pre_src_overhead) - remtimesrc.begin();
                                        
                                        int average_t = (tott[i] + tott[j] / (seq[j].size() + seq[i].size() + 2)),
                                        average_d = (totd[i] + totd[j] / (seq[j].size() + seq[i].size() + 2));
                                        int extra_loops = max((totv[i] + totv[j] - 1) / cap, (tott[i] + tott[j] - 2 * average_t) / workwindow); // estimated
                                        
                                        int deltat = -tott[i] - t[wid][target[0]] + t[wid][src[k]] + totsrctime + t[src[(k - 1 + src.size()) % src.size()]][target[0]] + 2 * extra_loops * average_t,
                                        deltad = -totd[i] - d[wid][target[0]] + d[wid][src[k]] + totsrcd + d[src[(k - 1 + src.size()) % src.size()]][target[0]] + 2 * extra_loops * average_d,
                                        deltaedd = -missededd[i] - missededd[j] + targetmissed + srcmissed + (extra_loops > 0 ? (seq[i].size() + seq[j].size()) / 3 : 0);
                                        
                                        
                                        int newcost = costfunction(totalmissed + deltaedd, totaltime + deltat, totaldistance + deltad);
                                        int totsavings = oldcost - newcost;
                                        
                                        if(totsavings > mx[0]){
                                                mx = {totsavings,i,j,k,0};
                                        }
                                        // ... l = 0 ends
                                        
                                        for(int l = 1, newl1t = t[wid][target[0]];l < target.size();l++){
                                                // insert src between l - 1 and l of target
                                                
                                                // update target missed here
                                                int newlt = newl1t + t[target[l - 1]][src[k]] + totsrctime + t[src[(k - 1 + src.size()) % src.size()]][target[l]];
                                                
                                                if(istargetmissed[l - 1] and newl1t <= edd[target[l - 1]]){
                                                        targetmissed--;
                                                        istargetmissed[l - 1] = 0;
                                                }
                                                else if(!istargetmissed[l - 1] and newl1t > edd[target[l - 1]]){
                                                        targetmissed++;
                                                        istargetmissed[l - 1] = 1;
                                                }
                                                
                                                if(istargetmissed[l] and newlt <= edd[target[l]]){
                                                        targetmissed--;
                                                        istargetmissed[l] = 0;
                                                }
                                                else if(!istargetmissed[l] and newlt > edd[target[l]]){
                                                        targetmissed++;
                                                        istargetmissed[l] = 1;
                                                }
                                                
                                                newl1t += t[target[l - 1]][target[l]];
                                                
                                                
                                                int pre_src_overhead = newl1t + t[target[l - 1]][src[k]];
                                                
                                                int srcmissed = lower_bound(remtimesrc.begin(),remtimesrc.end(), pre_src_overhead) - remtimesrc.begin();
                                                
                                                
                                                int deltat = -tott[i] - t[target[l - 1]][target[l]] + t[target[l - 1]][src[k]] + totsrctime + t[src[(k - 1 + src.size()) % src.size()]][target[l]] + 2 * extra_loops * average_t,
                                                deltad = -totd[i] - d[target[l - 1]][target[l]] + d[target[l - 1]][src[k]] + totsrcd + d[src[(k - 1 + src.size()) % src.size()]][target[l]] + 2 * extra_loops * average_d,
                                                deltaedd = -missededd[i] - missededd[j] + targetmissed + srcmissed + (extra_loops > 0 ? (seq[i].size() + seq[j].size()) / 3 : 0);
                                                
                                                
                                                int newcost = costfunction(totalmissed + deltaedd, totaltime + deltat, totaldistance + deltad);
                                                int totsavings = oldcost - newcost;
                                                
                                                if(totsavings > mx[0]){
                                                        mx = {totsavings,i,j,k,l};
                                                }
                                        }
                                }
                        }
                }
                
                // src and targets maybe {wid ... wid} instead of {...}
                // merging procedure
                auto [totsavings,srcid,targetid,srcedgeid,targetedgeid] = mx;
                if(totsavings == NINF){
                        break;
                }
                vector<int> newseq, src = seq[srcid], target = seq[targetid];
                
                for(int i = 0;i < targetedgeid;i++){
                        newseq.push_back(target[i]);
                }
                
                for(int i = 0;i < src.size();i++){
                        newseq.push_back(src[(i + srcedgeid) % src.size()]);
                }
                
                for(int i = targetedgeid;i < target.size();i++){
                        newseq.push_back(target[i]);
                }
                
                int newtott = 0, newtotd = 0,newmissededd = 0, newtotv = totv[targetid] + totv[srcid];
                for(int i = 0;i < newseq.size();i++){
                        if(!i){
                                newtott = t[wid][newseq[0]];
                                newtotd = d[wid][newseq[0]];
                        }
                        else{
                                newtott += t[newseq[i - 1]][newseq[i]];
                                newtotd += d[newseq[i - 1]][newseq[i]];
                        }
                        
                        if(newtott > edd[newseq[i]]){
                                newmissededd++;
                        }
                }
                
                // delete old seq and insert new ones
                seq.erase(seq.begin() + targetid);
                seq.insert(seq.begin() + targetid, newseq);
                seq.erase(seq.begin() + srcid);
                
                
                tott.erase(tott.begin() + targetid);
                tott.insert(tott.begin() + targetid, newtott);
                tott.erase(tott.begin() + srcid);
                
                totd.erase(totd.begin() + targetid);
                totd.insert(totd.begin() + targetid, newtotd);
                totd.erase(totd.begin() + srcid);
                
                totv.erase(totv.begin() + targetid);
                totv.insert(totv.begin() + targetid, newtotv);
                totv.erase(totv.begin() + srcid);
                
                missededd.erase(missededd.begin() + targetid);
                missededd.insert(missededd.begin() + targetid, newmissededd);
                missededd.erase(missededd.begin() + srcid);
        }
        missededd.clear();
        tott.clear();
        totv.clear();
        missededd.clear();
        for(auto &route : seq){
                route = GA_Optimise(route, t, d, edd, vol, n, wid, m, cap, 10000 / (2 * max(1.0,log(n))));
                route = handle_workandvol(route, vol, t, n, wid, m, cap);
        }
        return seq;
}

int evaluate_A(vector<vector<int>> &t,
               vector<vector<int>> &d,
               vector<int> &edd,    // edd[i] => deadline for ith delivery
               vector<int> &vol,    // volume[i] => volume for ith delivery
               int n,      // number of delivery points
               int wid,    // warehouse idx
               int m, // number of vehicles
               int cap     // vehicle cap
)
{
        int tbound = 0,dbound = 0, last = wid;
        for(int i = 0;i <= n;i++){
                if(i == wid){
                        continue;
                }
                tbound += t[last][i];
                dbound += d[last][i];
                last = i;
        }
        tbound += t[last][wid];
        dbound += d[last][wid];
        return sqrt(((m + 2) / 2) * tbound * dbound);
}

vector<vector<int>> GAsearch(
                             vector<vector<int>> &t,
                             vector<vector<int>> &d,
                             vector<int> &edd,    // edd[i] => deadline for ith delivery
                             vector<int> &vol,    // volume[i] => volume for ith delivery
                             int n,      // number of delivery points
                             int wid,    // warehouse idx
                             int m, // number of vehicles
                             int cap     // vehicle cap
)
{
        vector<int> chromo;
        for(int i = 0;i <= n;i++){
                if(i != wid){
                        chromo.push_back(i);
                }
        }
        
        vector<vector<int>> best;
        int bestcost = INF;
        // lim ^ 3 * nlogn = 1e6;
        int lim = max((int)10,(int)cbrt((1e7) / (n * max(1.0,log(n)))));
        
        for(int iter1 = 1;iter1 <= lim;iter1++){
                mutate(chromo);
                // set m boundaries
                for(int iter2 = 1;iter2 <= lim / 4;iter2++){
                        vector<int> sel;
                        for(int i = 1;i + 1 < chromo.size();i++){
                                sel.push_back(i);
                        }
                        vector<int> boundaries({0,(int)chromo.size() - 1});
                        int rem = m - 1;
                        while(rem--){
                                int idx = myrandom() % sel.size();
                                boundaries.push_back(sel[idx]);
                                swap(sel[idx],sel.back());
                                sel.pop_back();
                        }
                        
                        sort(boundaries.begin(),boundaries.end());
                        vector<vector<int>> seq;
                        for(int i = 1;i < boundaries.size();i++){
                                seq.emplace_back();
                                for(int j = boundaries[i - 1];j <= boundaries[i];j++){
                                        seq.back().push_back(chromo[j]);
                                }
                        }
                        for(auto &route : seq){
                                route = GA_Optimise(route, t, d, edd, vol, n, wid, m, cap, lim);
                                route = handle_workandvol(route, vol, t, n, wid, m, cap);
                        }
                        
                        int cost = costfunction(seq, t, d, edd, vol, n, wid, m, cap);
                        if(cost < bestcost){
                                best = seq;
                        }
                        
                }
                
        }
        return best;
}


vector<vector<int>> solve(vector<vector<int>> &t,
                          vector<vector<int>> &d,
                          vector<int> &edd,    // edd[i] => deadline for ith delivery
                          vector<int> &vol,    // volume[i] => volume for ith delivery
                          int n,      // number of delivery points
                          int wid,    // warehouse idx
                          int m, // number of vehicles
                          int cap     // vehicle cap
)
{
        A = evaluate_A(t,d,edd,vol,n,wid,m,cap);
        
        pair<int,int> best = {INF,-1};
        vector<vector<int>> default_sol({{-1}});
        
        
        vector<vector<int>> savings_sol = savings(t,d,edd,vol,n,wid,m,cap);
        int savings_cost = costfunction(savings_sol, t, d, edd, vol, n, wid, m, cap);
        best = min(best,{savings_cost,0});
        evaluate("Savings", savings_sol, t, d, edd, vol, n, wid, m, cap);
        
        
        vector<vector<int>> rayfinder_sol = ray_finder(t, d, edd, vol, n, wid, m, cap);
        int rayfinder_cost = costfunction(rayfinder_sol, t, d, edd, vol, n, wid, m, cap);
        best = min(best,{rayfinder_cost,1});
        evaluate("Rayfinder", rayfinder_sol, t, d, edd, vol, n, wid, m, cap);
        
        vector<vector<int>> ap3_sol;
        try{
                ap3_sol = ap3(t, d, edd, vol, n, wid, m, cap);
                int ap3_cost = costfunction(ap3_sol, t, d, edd, vol, n, wid, m, cap);
                best = min(best,{ap3_cost,2});
                evaluate("ap3", ap3_sol, t, d, edd, vol, n, wid, m, cap);
        }
        catch(...){
                cerr <<"Ap3 error\n";
        }
        
        
        
        vector<vector<int>> GAsearch_sol = GAsearch(t,d,edd,vol,n,wid,m,cap);
        int GAsearch_cost = costfunction(GAsearch_sol, t, d, edd, vol, n, wid, m, cap);
        best = min(best,{GAsearch_cost,3});
        evaluate("GAsearch", GAsearch_sol, t, d, edd, vol, n, wid, m, cap);
        
        
        
        switch(best.second){
                case 0 : return savings_sol;
                case 1 : return rayfinder_sol;
                case 2 : return ap3_sol;
                case 3 : return GAsearch_sol;
                default: cerr << "No best found in solve\n";
                        cout << -1;
                        return default_sol;
        }
        
}


vector<vector<vector<int>>> process_for_output(vector<vector<int>> seq,
                                               vector<vector<int>> &t,
                                               vector<vector<int>> &d,
                                               vector<int> &edd,    // edd[i] => deadline for ith delivery
                                               vector<int> &vol,    // volume[i] => volume for ith delivery
                                               int n,      // number of delivery points
                                               int wid,    // warehouse idx
                                               int m, // number of vehicles
                                               int cap     // vehicle cap

)
{
        
        vector<vector<vector<int>>> routes;
        for(auto &route : seq){
                routes.emplace_back();
                auto &riderroutes = routes.back();
                if(route.empty()){
                        continue;
                }
                
                int tott = t[wid][route[0]], days = 0;
                riderroutes.push_back(vector<int>({route[0]}));
                for(int i = 1;i < route.size();i++){
                        tott += t[route[i - 1]][route[i]];
                        if((tott - 1) / workwindow != days){
                                days++;
                                riderroutes.emplace_back();
                                tott = days * workwindow + t[wid][route[i]];
                        }
                        riderroutes.back().push_back(route[i]);
                }
                
                for(auto &route : riderroutes){
                        while(!route.empty() and route.back() == wid){
                                route.pop_back();
                        }
                }
        }
        
        return routes;
}

void process_edd(vector<int> &edd){
        int minedd = *min_element(edd.begin(),edd.end());
        for(auto &j : edd){
                j -= minedd;
                int days = ((j / (24 * 3600 * 1000)) + 25) / 31;
                j = days + 1;
                j *= workwindow;
                //                cout << j;nl;
        }
}

int32_t main(){
        ios_base::sync_with_stdio(0);cin.tie(0);cout.tie(0);
        /* freopen("/Users/jenish/Desktop/Inter iit/saved_input.txt","r",stdin); */
        //        freopen("/Users/jenish/Desktop/Inter iit/out.txt","w",stdout);
        
        int n,  // number of delivery points excluding warehouse. So total (n + 1) locations
        m,      // number of delivery vehicles
        wid,    // warehouse id. Try keeping it 0
        cap;    // capacity of each vehicle
        cin >> n >> m >> wid >> cap;
        vector<vector<int>> t,  // (n + 1) x (n + 1) matrix. t[i][j] => time in seconds taken to reach location j from location i
        d;      // (n + 1) x (n + 1) matrix. d[i][j] => distance in meters taken to location j from location i
        vector<int> edd,    // vector of (n + 1). edd[i] => deadline in seconds for location i. Keep edd[wid] = infinity
        vol;    // vector of (n + 1). vol[i] => volume for location i. Keep vol[wid] = 0
        read(t,n);
        read(d,n);
        read(edd,n);
        read(vol,n);
        maxv = *max_element(vol.begin(), vol.end());
        edd[wid] = INF;
        vol[wid] =  0;
        process_edd(edd);
        
        vector<vector<int>> solution = solve(t, d, edd, vol, n, wid, m, cap);
        evaluate("Solution", solution, t, d, edd, vol, n, wid, m, cap);
        vector<vector<vector<int>>> routes = process_for_output(solution, t, d, edd, vol, n, wid, m, cap);
        evaluate("Final Solution", routes, t, d, edd, vol, n, wid, m, cap);
        
        
        // all output on stdout for the calling programmes
        for(auto &riderroutes : routes){
                cout << riderroutes.size() <<endl;      // represents number of days
                for(auto &route : riderroutes){
                        //                        cout << route.size() <<" "; // not required
                        for(auto j : route){
                                cout << j <<" ";
                        }
                        cout << endl;
                }
        }
}
