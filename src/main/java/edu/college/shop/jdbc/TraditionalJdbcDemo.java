package edu.college.shop.jdbc;

import java.sql.Connection; import java.sql.PreparedStatement; import java.sql.ResultSet; import java.sql.SQLException; import java.util.ArrayList; import java.util.List;
import javax.sql.DataSource; import org.springframework.stereotype.Service;

/** A tiny manual JDBC version of product search, kept separate for the course comparison. */
@Service public class TraditionalJdbcDemo {
    private final DataSource dataSource; public TraditionalJdbcDemo(DataSource dataSource){this.dataSource=dataSource;}
    public List<String> searchProductNames(String search){
        String sql="SELECT name FROM products WHERE name LIKE ? ORDER BY name";List<String> names=new ArrayList<>();
        try(Connection connection=dataSource.getConnection();PreparedStatement statement=connection.prepareStatement(sql)){
            statement.setString(1,"%"+search+"%");try(ResultSet results=statement.executeQuery()){while(results.next())names.add(results.getString("name"));}
        }catch(SQLException e){throw new IllegalStateException("Traditional JDBC product search failed",e);}return names;
    }

    /** Manual JDBC transaction matching the Spring JDBC stock update endpoint. */
    public void setStock(long productId,int stock){
        if(stock<0)throw new IllegalArgumentException("Stock cannot be negative");
        try(Connection connection=dataSource.getConnection()){
            boolean previousAutoCommit=connection.getAutoCommit();connection.setAutoCommit(false);
            try(PreparedStatement statement=connection.prepareStatement("UPDATE products SET stock=? WHERE id=?")){
                statement.setInt(1,stock);statement.setLong(2,productId);
                if(statement.executeUpdate()!=1)throw new IllegalArgumentException("Product not found: "+productId);
                connection.commit();
            }catch(SQLException|RuntimeException e){
                connection.rollback();throw e;
            }finally{connection.setAutoCommit(previousAutoCommit);}
        }catch(SQLException e){throw new IllegalStateException("Traditional JDBC stock update failed",e);}
    }
}
