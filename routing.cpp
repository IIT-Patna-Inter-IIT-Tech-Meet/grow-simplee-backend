#include <bits/stdc++.h>
#define NINF -1000000000000000000
#define INF 1000000000000000000
#define FITCONST 1000000000000
#define int long long
//#define FITCONST 1000000000
//#define INF 1000000000
//#define NINF -1000000000
#define nl cout<<endl;
#define sp <<" "<<
using namespace std;

template<class T> using minpq = priority_queue<T,vector<T>,greater<T> >;

int A;


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
                        cout << j <<" ";
                }
                nl;
        }
}
void print(vector<int> &v){
        for(auto &j:v){
                cout << j <<" ";
        }
        nl;
}

int costfunction(int missededd,int tott,int totd){
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
        int missededd = 0, tott = 0, totd = 0;
        for(int i = 0;i < route.size();i++){
                if(!i){
                        tott += t[wid][route[0]];
                        totd += d[wid][route[0]];
                }
                else{
                        tott += t[route[i - 1]][route[i]];
                        totd += d[route[i - 1]][route[i]];
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
                int pretime = 0, predist = 0;
                for(int i = 0;i < v.size();i++){
                        if(!i){
                                pretime += t[wid][v[0]];
                                predist += d[wid][v[0]];
                        }
                        else{
                                pretime += t[v[i - 1]][v[i]];
                                predist += d[v[i - 1]][v[i]];
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
        for(auto &v : seq){
                if(v.empty()){
                        continue;
                }
                int pretime = 0, predist = 0;
                for(int i = 0;i < v.size();i++){
                        if(!i){
                                pretime += t[wid][v[0]];
                                predist += d[wid][v[0]];
                        }
                        else{
                                pretime += t[v[i - 1]][v[i]];
                                predist += d[v[i - 1]][v[i]];
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
        
        cout << approach;nl;
        cout << "Missed EDD :" sp missededd sp "Total time :" sp tott sp "Total distance" sp totd sp "Cost :" sp costfunction(missededd, tott, totd);nl;
        print(seq);
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

vector<int> handle_capacity(vector<int> route,
                            vector<int> &vol,    // volume[i] => volume for ith delivery
                            int n,      // number of delivery points
                            int wid,    // warehouse idx
                            int m, // number of vehicles
                            int cap     // vehicle cap
)
{
        route = remove_wid(route,wid);
        vector<int> reroute;
        int sum = 0;
        for(auto j : route){
                sum += vol[j];
                if(sum > cap){
                        sum = vol[j];
                        reroute.push_back(wid);
                }
                reroute.push_back(j);
        }
        return reroute;
}

vector<vector<int>> handle_capacity(vector<vector<int>> &seq,
                                    vector<int> &vol,    // volume[i] => volume for ith delivery
                                    int n,      // number of delivery points
                                    int wid,    // warehouse idx
                                    int m, // number of vehicles
                                    int cap     // vehicle cap
)
{
        vector<vector<int>> ans;
        for(auto &v : seq){
                ans.emplace_back();
                for(int i = 0,sum = 0;i < v.size();i++){
                        if(v[i] == wid){
                                sum = 0;
                        }
                        else{
                                sum += vol[v[i]];
                        }
                        if(sum > cap){
                                ans.back().push_back(wid);
                                sum = vol[v[i]];
                        }
                        ans.back().push_back(v[i]);
                }
        }
        return ans;
}

int get_fitness(vector<int> &seq,
                vector<vector<int>> &t,
                vector<vector<int>> &d,
                vector<int> &edd,    // edd[i] => deadline for ith delivery
                int n,      // number of delivery points
                int wid,    // warehouse idx
                int m // number of vehicles
)
{
        return (INF / 1000) / costfunction(seq, t, d, edd, n, wid, m);
}

void mutate(vector<int> &seq){
        int l = myrandom() % seq.size(), r = myrandom() % seq.size();
        if(l > r){
                swap(l,r);
        }
        if(myrandom() % 2){
                swap(seq[l],seq[r]);
        }
        else{
                reverse(seq.begin() + l,seq.begin() + r);
        }
}

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

int spin(vector<int> &roulette){
        return upper_bound(roulette.begin(),roulette.end(),myrandom() % roulette.back()) - roulette.begin();
}

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
        for(int temperature = generations;temperature >= 0;temperature--){
                // find theta = f(temp) such that initially it has tendency to be close to 1 but later to 0

                int p1 = 0,p2 = 0;
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

                child = handle_capacity(child, vol, n, wid, m, cap);
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
                        child = handle_capacity(child, vol, n, wid, m, cap);
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
                unordered_map<int,int> &p
                )
{
        if(rem.count(i)){
                tour.push_back(i);
                rem.erase(i);
        }
//        cout << i sp p[i] sp mst[i].size() sp endl;
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
        if(n <= 100){
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
                
                vector<vector<int>> seq(m);
                
                // distribute among seq but time efficiently!
                // improvise here please
                for(int j = 0;j < partitions.size();j++){
                        for(int i = 0;i < partitions[j].size();i++){
                                seq[i].push_back(partitions[j][i].second);
                        }
                }
                
                unordered_set<int> rem;
                for(int i = boundary + 1;i < times.size();i++){
                        rem.insert(times[i].second);
                }
                
                vector<int> starting_points;
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
                                if(j == seq[i].back()){
                                        continue;
                                }
                                seq[i].push_back(j);
                        }
                }
                seq = handle_capacity(seq, vol, n, wid, m, cap);
                
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
                route = GA_Optimise(route, t, d, edd, vol, n, wid, m, cap, (1e8 / (n * n)));
                route = handle_capacity(route, vol, n, wid, m, cap);
        }
        return best;
}


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
//                cout << seq.size();nl; // for debug
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
//                                if(i % 100 == 0){
//                                        cout << i sp j;nl;
//
//                                }
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
                                        
                                        int extra_loops = (totv[i] + totv[j] - 1) / cap;
                                        int average_t = (tott[i] + tott[j] / (seq[j].size() + seq[i].size() + 2)), average_d = (totd[i] + totd[j] / (seq[j].size() + seq[i].size() + 2));
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
                                                
                                                int extra_loops = (totv[i] + totv[j] - 1) / cap;
                                                int average_t = (tott[i] + tott[j] / (seq[j].size() + seq[i].size() + 2)), average_d = (totd[i] + totd[j] / (seq[j].size() + seq[i].size() + 2));
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
        for(int i = 0;i < seq.size();i++){
                seq[i] = GA_Optimise(seq[i], t, d, edd, vol, n, wid, m, cap, 10000 / (2 * max(1.0,log(n))));
        }
        seq = handle_capacity(seq,vol,n,wid,m,cap);
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
                                route = handle_capacity(route, vol, n, wid, m, cap);

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
        best = min(best,{costfunction(rayfinder_sol, t, d, edd, vol, n, wid, m, cap),1});
        evaluate("Rayfinder", rayfinder_sol, t, d, edd, vol, n, wid, m, cap);



        vector<vector<int>> GAsearch_sol = GAsearch(t,d,edd,vol,n,wid,m,cap);
        int GAsearch_cost = costfunction(GAsearch_sol, t, d, edd, vol, n, wid, m, cap);
        best = min(best,{GAsearch_cost,2});
        evaluate("GAsearch", GAsearch_sol, t, d, edd, vol, n, wid, m, cap);

        
        
        switch(best.second){
                case 0 : return savings_sol;
                case 1 : return rayfinder_sol;
                case 2 : return GAsearch_sol;
                default: cout << "No best found in solve\n";
                        return default_sol;
        }
        
}



int32_t main(){
        ios_base::sync_with_stdio(0);cin.tie(0);cout.tie(0);
        // do a binary lift on m as well
        
        
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

        vector<vector<int>> solution = solve(t, d, edd, vol, n, wid, m, cap);
        cout << "solution\n";nl;
        print(solution);
}
