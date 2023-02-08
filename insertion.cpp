#include <bits/stdc++.h>
#define NINF -1000000000000000000
#define INF 1000000000000000000
#define FITCONST 1000000000000
#define int long long

#define nl cerr<<endl;
#define sp <<" "<<
using namespace std;

template<class T> using minpq = priority_queue<T,vector<T>,greater<T> >;

int A,maxv;
int workwindow = 12 * 3600;

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

vector<int> remove_wid(vector<int> route,int wid){
        vector<int> reroute;
        for(int i = 0;i < route.size();i++){
                if(route[i] != wid){
                        reroute.push_back(route[i]);
                }
        }
        return reroute;
}

int costfunction(int missededd,int tott,int totd){
        return A * (missededd) + sqrt(tott * totd);
}

int costfunction(vector<int> &route,
                 vector<vector<int>> &t,
                 vector<vector<int>> &d,
                 vector<int> &edd,    // edd[i] => deadline for ith delivery
                 int ellapsed,
                 int n,      // number of delivery points
                 int wid,    // warehouse idx
                 int m // number of vehicles
)
{
        int missededd = 0, tott = 0, totd = 0, days = 0;
        for(int i = 0;i < route.size();i++){
                if(!i){
                        tott += ellapsed;
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
                 int ellapsed,
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
                                pretime += ellapsed;
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
        
        cerr << approach;nl;
        cerr << "Missed EDD :" sp missededd sp "Total time :" sp tott sp "Total distance" sp totd sp "Cost :" sp costfunction(missededd, tott, totd);nl;
        print(seq);
}

vector<int> remove_wid(vector<int> route,int wid,int &seq_prog){
        vector<int> reroute;
        for(int i = 0;i < route.size();i++){
                if(route[i] != wid){
                        reroute.push_back(route[i]);
                }
                else if(i < seq_prog){
                        seq_prog--;
                }
        }
        
        return reroute;
}

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

// check this thoroughly
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

bool valid(vector<int> route,
           vector<vector<int>> &t,
           int ellapsed,        // time ellapsed on that day
           int pid,
           int wid
           )
{
        int tott = 0;
        for(int i = 0;i < route.size();i++){
                if(!i){
                        tott += ellapsed;
                }
                else{
                        tott += t[route[i - 1]][route[i]];
                }
                if(route[i] == pid){
                        if(tott > workwindow){
                                return false;
                        }
                        else{
                                return true;
                        }
                }
        }
        return true;
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



void dynamic_insertion(
                       vector<vector<int>> &seq,
                       vector<vector<int>> &t,
                       vector<vector<int>> &d,
                       vector<int> &edd,    // edd[i] => deadline for ith delivery wrt to that day
                       vector<int> &vol,    // volume[i] => volume for ith delivery
                       int ellapsed,     // // time ellapsed on that day
                       int pid,  // pickup id
                       int n,      // number of delivery points
                       int wid,    // warehouse idx
                       int m, // number of vehicles
                       int cap     // vehicle cap
)
{
        A = evaluate_A(t,d,edd,vol,n,wid,m,cap);
        
        pair<int,int> best({INF,-1});
        vector<int> bestroute;
        for(int i = 0;i < seq.size();i++){
                auto v = seq[i];
                v = remove_wid(v,wid);
                v.push_back(pid);
                for(int j = (int)v.size() - 2;j >= 0;j--){
                        vector<int> reroute = handle_workandvol(v, vol, t, n, wid, m, cap);
                        if(valid(reroute,t,ellapsed,pid,wid)){
                                best = min(best,{costfunction(reroute, t, d, edd, ellapsed, n, wid, m),i});
                                bestroute = reroute;
                        }
                        swap(v[j],v[j + 1]);
                }
        }
        
        if(bestroute.empty()){
                cout << 0 << endl;
                for(auto j : seq[0]){
                        cout << j << " ";
                }
                cout << endl;
                cout << pid;
                return;
        }
        unordered_set<int> nextdaypoints;
        
        int tott = 0;
        for(int i = 0;i < bestroute.size();i++){
                if(!i){
                        tott += ellapsed;
                }
                else{
                        tott += t[bestroute[i - 1]][bestroute[i]];
                }
                if((tott - 1) / workwindow >= 1){
                        nextdaypoints.insert(bestroute[i]);
                }
        }
        
        while(!bestroute.empty() and (nextdaypoints.count(bestroute.back()) or bestroute.back() == wid)){
                bestroute.pop_back();
        }
        nextdaypoints.erase(wid);
        
        cout << best.second << endl;
        for(auto j : bestroute){
                cout << j << " ";
        }
        cout << endl;
        for(auto j : nextdaypoints){
                cout << j << " ";
        }
}

// edd of pickup is same day
// you will get data only for today for each driver
// if some points fall out of work window due to pickups, you mention them explicitly that they need to be given as inputs when routing algo is run next day
// note : ellapsed will be different for every driver

int32_t main(){
        ios_base::sync_with_stdio(0);cin.tie(0);cout.tie(0);
#ifndef ONLINE_JUDGE
        freopen("/Users/jenish/Desktop/Inter iit/dynamicinp.txt","r",stdin);
//        freopen("/Users/jenish/Desktop/Inter iit/out.txt","w",stdout);
#endif
        int n,  // number of delivery points excluding warehouse but including pickup location. So total (n + 1) locations
        m,      // number of delivery vehicles
        wid,    // warehouse id. Try keeping it 0
        cap,    // capacity of each vehicle
        ellapsed,       // time already passed
        pid;    // id of pickup location at last
        cin >> n >> m >> wid >> cap;
        vector<vector<int>> t,d;        // these also includes pickup location data
        vector<int> edd,vol;    // these also includes pickup location data
        read(t,n);
        read(d,n);
        read(edd,n);
        for(auto &j : edd){
                j *= workwindow;
        }
        read(vol,n);
        for(auto j : vol){
                maxv = max(maxv,j);
        }
        vector<vector<int>> seq(m);
        for(auto &route : seq){
                int sz;
                cin >> sz;
                route.resize(sz);
                for(auto &j : route){
                        cin >> j;
                }
        }
        
        cin >> ellapsed >> pid;
        edd[pid] = workwindow * 1;

        dynamic_insertion(seq, t, d, edd, vol, ellapsed, pid, n, wid, m, cap);

}
